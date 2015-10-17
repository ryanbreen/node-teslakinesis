var AWS = require('aws-sdk');
var crypto = require('crypto');
var pg = require('pg');
var _ = require('underscore');
var zlib = require('zlib');

var db_creds = require('./creds/db.js');
var logentries_creds = require('./creds/logentries.js');

var bunyan = require('bunyan');
var bunyanLogentries = require('bunyan-logentries');

var logentries_stream = bunyanLogentries.createStream({token: logentries_creds.TOKEN});
var logger = module.exports.logger = bunyan.createLogger({
  name: 'skunkworks',
  level: 'debug',
  streams: [{
    level: 'debug',
    stream: logentries_stream,
    type: 'raw'
  }]
});

// This is kind of janky, but it's the best mechanism I can yet find for making sure
// the logs actually flush and get sent to logentries.
var flushed = false;
logentries_stream['_logger'].on('connect', function() {
  flushed = true;
});

var complete = function(err, context) {
  var counter = 100;
  var interval = setInterval(function(){
    --counter;
    if (flushed || counter <= 0) {
      clearInterval(interval);
      if (err) return context.fail(err);
      context.succeed();
    }
  }, 10);
}

var PURGE_TRIP_DETAIL_FOR_TRIP = "delete from trip_details where trip_id = $1;";
var GET_TRIP = "select * from trips where id = $1;";
var GET_METRICS_FOR_TRIP = "SELECT id, vehicle_id, \"timestamp\", speed, odometer, soc, elevation, \
       est_heading, heading, st_asgeojson(location) as location, power, shift_state, range, est_range, \
       created_at, updated_at, trip_id \
  FROM vehicle_telemetry_metrics where trip_id = $1 order by timestamp;";
var INSERT_TRIP_DETAILS = "INSERT INTO trip_details( \
            vehicle_id, trip_id, detailed_route, summary_route, upper_left, \
            lower_right, created_at, updated_at) \
    VALUES ($1, $2, $3, $4, $5, \
            $6, NOW(), NOW()) returning id;";

// For detailed routes, we want to use line segments of different colors to represent different speeds.
// We use green for 0-25MPH, orange for 25-50MPH, and red for 50+.
COLOR_SCALE = [
  "#74AD6A",
  "#FFAA38",
  "#C44537"
];

function calculateTripDetail(client, context, trip_id, cb) {
  logger.info({trip_id: trip_id}, "Calculating trip detail");

  // We plan to build trip detail, so purge any that already exists.
  client.query(PURGE_TRIP_DETAIL_FOR_TRIP, [trip_id], function(err, results) {
    if (err) {
      logger.error(err, 'Trip detail purge failed');
      return complete(err, context);
    }

    // Find current trip.  If none and car is in gear, create a new trip.
    client.query(GET_TRIP, [trip_id], function(err, trip) {
      if (err) {
        logger.error(err, 'Trip metric query failed');
        return complete(err, context);
      }

      // Find current trip.  If none and car is in gear, create a new trip.
      client.query(GET_METRICS_FOR_TRIP, [trip_id], function(err, metrics) {
        if (err) {
          logger.error(err, 'Trip metric query failed');
          return complete(err, context);
        }

        logger.info({metrics_count: metrics.rows.length}, "Found metrics for trip.");

        var lowest_lng = highest_lng = lowest_lat = highest_lat = undefined;
        var current_hash = [];
        var current_hash_speed = undefined;

        // We create two buffers to store in the trip_detail record: 1 with every point in the trip and another
        // with 1/16th of the points.  The latter, which represents a data point every 4 seconds while driving,
        // is much quicker to load while being appropriate for busy pages like trip#index.
        var summary_js_buffer = [];
        summary_js_buffer.push("var polylines = [];\n");
        summary_js_buffer.push("polylines.push([ [");

        var detailed_js_buffer = [];
        detailed_js_buffer.push("var polylines = [];\n");

        var first_line = true;

        /**
        badge_types = BadgeType.all
        badge_processors = []
        badge_types.each do |type|
          badge_processors << type.dup
        end
        **/

        // While the vehicle is in motion, the stream generates a datapoint every 250ms.  Loop over each
        // metric and use it to populate pre-computed route paths and to calculate route bounding boxes.
        metrics.rows.forEach(function(metric) {

          logger.debug(metric);

          // Location is a geojson string, so we must parse it to interact with it.
          metric.location = JSON.parse(metric.location);

          if (metric.id % 16 == 0) {
            if (!first_line) summary_js_buffer.push(',');
            summary_js_buffer.push(JSON.stringify({lat : metric.location.coordinates[1], lng : metric.location.coordinates[0]}));
            first_line = false;
          }

          /**
          # Process this vehicle metric for each badge type
          badge_processors.each do |badge_processor|
            badge_processor.process_metric self.original_trip_detail, metric
          end
          **/

          if (lowest_lat == undefined  || metric.location.coordinates[1] < lowest_lat) lowest_lat = metric.location.coordinates[1];
          if (lowest_lng == undefined  || metric.location.coordinates[0] < lowest_lng) lowest_lng = metric.location.coordinates[0];
          if (highest_lat == undefined || metric.location.coordinates[1] > highest_lat) highest_lat = metric.location.coordinates[1];
          if (highest_lng == undefined || metric.location.coordinates[0] > highest_lng) highest_lng = metric.location.coordinates[0];

          // We bucket speeds such that, in the detailed map buffer, trip segments of similar speeds are
          // displayed as a colored polyline.
          if(metric.speed <= 25) {
            var speed = 0;
          } else if (metric.speed <= 50) {
            var speed = 1;
          } else {
            var speed = 2;
          }

          // If the previous bucket differs from the bucket of this metric, create a new polyline at the
          // new speed.
          if (current_hash_speed != speed) {
            if (current_hash.length > 0) {
              detailed_js_buffer.push("polylines.push([ [");
              detailed_js_buffer.push(current_hash.join(''));
              detailed_js_buffer.push("], \'");
              detailed_js_buffer.push(COLOR_SCALE[current_hash_speed]);
              detailed_js_buffer.push("\']);\n");
            }
            current_hash_speed = speed;
            current_hash = [];
          }

          // Add this metric to the current speed-bucket polyline.
          if (current_hash.length > 0) current_hash.push(",");
          current_hash.push(JSON.stringify({lat : metric.location.coordinates[1], lng : metric.location.coordinates[0]}));
        });

        // If this trip is complete, send metrics_complete to each badge processor.
        if (trip.end_time != undefined) {
          /**
          badge_processors.each do |badge_processor|
            badge_processor.metrics_complete self.original_trip_detail
          end
          **/
        }

        // All metrics in the summary polyline use the same color.
        summary_js_buffer.push("], \'");
        summary_js_buffer.push(COLOR_SCALE[0]);
        summary_js_buffer.push("\']);\n");

        logger.info(detailed_js_buffer.join(''));
        logger.info(summary_js_buffer.join(''));

        // The JS buffers are very large but compress well, so we store them deflated.
        var detailed_route = zlib.deflateSync(detailed_js_buffer.join('')).toString('base64');
        var summary_route = zlib.deflateSync(summary_js_buffer.join('')).toString('base64');

        // The client needs to know the bounding box for this map.  This is defined by the coordinates of the furthest
        // top left and bottom right points.
        var upper_left = JSON.stringify({ lng: lowest_lng, lat: highest_lat });
        var lower_right = JSON.stringify({ lng: highest_lng, lat: lowest_lat });

        // Insert new trip_details record
        logger.info({upper_left: upper_left, lower_right: lower_right}, "Calculated bounds");

        // Find current trip.  If none and car is in gear, create a new trip.
        client.query(INSERT_TRIP_DETAILS, [trip.vehicle_id, trip_id, detailed_route, summary_route, upper_left, lower_right], function(err, res) {

          if (err) {
            logger.error(err, 'Trip detail insert failed');
            return complete(err, context);
          }

          logger.info(res, "Created trip detail");
          cb();
        });
      });
    });
  });
}

exports.handler = function(record, context) {

  var conn_string = "postgres://" + db_creds.DB_USER + ":" + db_creds.DB_PASSWORD + "@teslaprime.cfwzoyel2syn.us-east-1.rds.amazonaws.com/tesla";
  pg.connect(conn_string, function(err, client, done) {

    try {
      if (err) return complete(err, context);

      // If we were provided a trip_id, process it for metrics.  If not, look for a trip to process.
      if (record && record.trip_id) {
        calculateTripDetail(client, context, record.trip_id, function(err) {
          complete(err, context);
        });
      }

    } catch(e) {
      context.fail("Fail due to " + e);
    }
  });
};