var AWS = require('aws-sdk');
var crypto = require('crypto');
var pg = require('pg');
var _ = require('underscore');
var zlib = require('zlib');

var db_creds = require('./creds/db.js');
var logentries_creds = require('./creds/logentries.js');

var bunyan = require('bunyan');
var bunyanLogentries = require('bunyan-logentries');

var badge_types = require('./badges/');

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

logentries_stream['_logger'].on('connection drain', function() {
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
var GET_METRICS_FOR_TRIP = "SELECT id, vehicle_id, EXTRACT(EPOCH FROM timestamp) * 1000 as timestamp, speed, \
      odometer, soc, elevation, est_heading, heading, st_asgeojson(location) as location, power, shift_state, range, est_range, \
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
    client.query(GET_TRIP, [trip_id], function(err, trip_record) {
      if (err) {
        logger.error(err, 'Trip metric query failed');
        return complete(err, context);
      }

      var trip = trip_record.rows[0];

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

        var start = new Date().getTime();

        // Initialize a badge processor for each badge type
        var badge_processors = [];
        badge_types.forEach(function(BadgeType) {
          badge_processors.push(new BadgeType());
        });

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

          // Process this vehicle metric for each badge type
          badge_processors.forEach(function(badge_processor) {
            badge_processor.process_metric(metric);
          });

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
          // Process this vehicle metric for each badge type
          badge_processors.forEach(function(badge_processor) {
            badge_processor.metrics_complete();
          });
        }

        // All metrics in the summary polyline use the same color.
        summary_js_buffer.push("], \'");
        summary_js_buffer.push(COLOR_SCALE[0]);
        summary_js_buffer.push("\']);\n");

        // The JS buffers are very large but compress well, so we store them deflated.
        zlib.deflate(detailed_js_buffer.join(''), function(err, buf) {
          if (err) return complete(err, context);
          var detailed_route = buf.toString('base64');
          zlib.deflate(summary_js_buffer.join(''), function(err, buf) {
            if (err) return complete(err, context);
            var summary_route = buf.toString('base64');

            // The client needs to know the bounding box for this map.  This is defined by the coordinates of the furthest
            // top left and bottom right points.
            var upper_left = JSON.stringify({ lng: lowest_lng, lat: highest_lat });
            var lower_right = JSON.stringify({ lng: highest_lng, lat: lowest_lat });

            // Insert new trip_details record
            logger.info({duration: (new Date().getTime() - start)}, 'Processing completed');

            // Find current trip.  If none and car is in gear, create a new trip.
            client.query(INSERT_TRIP_DETAILS, [trip.vehicle_id, trip_id, detailed_route, summary_route, upper_left, lower_right], function(err, res) {

              if (err) {
                logger.error(err, 'Trip detail insert failed');
                return complete(err, context);
              }

              var trip_detail_id = res.rows[0].id;
              logger.info({trip_detail_id: trip_detail_id}, "Saved new trip detail id");

              // First, delete all badges for this trip.
              client.query("DELETE FROM badges where trip_id = $1;", [trip_id], function(err) {
                if (err) {
                  logger.error(err, 'Badge delete failed');
                  return complete(err, context);
                }

                // Render all created badges
                var trip_details = {logger:logger, id: trip_id, vehicle_id: trip.vehicle_id, trip_detail_id: trip_detail_id, trip: trip};

                // Gather up all the pending sql operations as a result of the pending badge creates / deletes.
                var sql_functions = [];
                badge_processors.forEach(function(badge_processor) {
                  sql_functions = sql_functions.concat(badge_processor.getSQLFunctions());
                });

                // If there are pending operations as a result of badge creation, run them and cb once all are
                // complete.  Otherwise, callback immediately.
                if (sql_functions.length > 0) {
                  var deferred_cb = _.after(sql_functions.length, cb);
                  logger.info(sql_functions.length, "Running badge processing operations");
                  sql_functions.forEach(function(sql_fn) {
                    sql_fn(client, trip_details, deferred_cb);
                  });
                } else cb();
              });
            });
          });
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

        client.query0 = client.query;
        client.query = function(config, params, cb) {
          logger.info({values: params}, config);
          client.query0(config, params, cb);
        };
      }

    } catch(e) {
      context.fail("Fail due to " + e);
    }
  });
};

