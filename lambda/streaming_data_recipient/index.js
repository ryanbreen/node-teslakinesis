var AWS = require('aws-sdk');
var crypto = require('crypto');
var pg = require('pg');
var _ = require('underscore');

var INSERT_METRIC =
  "INSERT INTO vehicle_telemetry_metrics(id, vehicle_id, timestamp, speed, odometer, soc, elevation, " +
    "est_heading, heading, location, power, shift_state, range, est_range, trip_id, created_at, updated_at) " +
    "VALUES (DEFAULT, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, now(), now());"
var ADD_TRIP =
  "INSERT INTO trips(id, vehicle_id, start_time, end_time, start_location, start_location_id, end_location, created_at, updated_at) " +
    "VALUES (DEFAULT, $1, $2, NULL, $3, " +
      "(select id from locations where ST_DWithin($3, geolocation, 200) order by ST_Distance($3, geolocation) limit 1), " +
    "NULL, now(), now()) RETURNING id;";
var CURRENT_TRIP = "SELECT id from trips where vehicle_id = $1 and end_time IS NULL;"
var CLOSE_TRIP = "UPDATE trips set end_time = $1, end_location = $2, end_location_id = " +
  "(select id from locations where ST_DWithin($2, geolocation, 200) order by ST_Distance($2, geolocation) limit 1), " +
  "updated_at = now() where id = $3;";

var PURGE_NONSENSE_TRIPS = "DELETE from trips where vehicle_id = $1 and ST_DWithin(start_location, end_location, 200) and " + 
  "(EXTRACT(EPOCH FROM (end_time - start_time)) < 60)";

// TODO: Remove trips that have a small number of points since they are likely due to a race condition calling
// close_trip
var DELETE_DUPLICATE_TRIPS = "DELETE from trips where vehicle_id = $1 and id in (select counter.trip_id from (select trip_id, count(trip_id) as total from vehicle_telemetry_metrics group by trip_id) counter where counter.total < 10)"
var DELETE_ORPHANED_TRIP_DETAILS = "DELETE from vehicle_telemetry_metrics where vehicle_id = $1 and trip_id in (select counter.trip_id from (select trip_id, count(trip_id) as total from vehicle_telemetry_metrics group by trip_id) counter where counter.total < 10)"
var DELETE_ORPHANED_BADGES = "DELETE from badges where vehicle_id = $1 and trip_id in (select counter.trip_id from (select trip_id, count(trip_id) as total from vehicle_telemetry_metrics group by trip_id) counter where counter.total < 10)"
var DELETE_ORPHANED_METRICS = "DELETE from vehicle_telemetry_metrics where vehicle_id = $1 and trip_id in (select counter.trip_id from (select trip_id, count(trip_id) as total from vehicle_telemetry_metrics group by trip_id) counter where counter.total < 10)"

var creds = require('./creds/db.js');

exports.handler = function(record, context) {

  var conn_string = "postgres://" + creds.DB_USER + ":" + creds.DB_PASSWORD + "@teslaprime.cfwzoyel2syn.us-east-1.rds.amazonaws.com/tesla";
  pg.connect(conn_string, function(err, client, done) {

    try {
      if (err) return context.fail(err);

      // A trip starts when the car shifts into gear after previously not being in gear.
      // A trip ends when the car shifts out of gear after previously being in gear.
      var current_trip;

      // All records are the same vehicle_id, so pull one from the first record.
      // TODO: Make this more robust.
      var vehicle_id = record.vehicle_id;

      // Find current trip.  If none and car is in gear, create a new trip.
      client.query(CURRENT_TRIP, [vehicle_id], function(err, result) {
        if (err) {
          console.error('Trip query failed due to %s', err);
          return context.fail(err);
        }

        var in_trip = result.rows.length > 0;
        console.log("Starting state in_trip? %s", in_trip);

        current_trip = in_trip && result.rows[0].id;

        if (isNaN(parseFloat(record['odometer']))) return;

        var timestamp = new Date(parseInt(record['timestamp'])).toISOString();
        var point = "POINT(" + record['est_lng'] + ' ' + record['est_lat'] + " " + record['elevation'] + ")";

        var unshifted = record.shift_state === '';

        console.log("in_trip = %s, shift_state = %s, unshifted = %s", in_trip, record['shift_state'], unshifted);
        if (unshifted && in_trip) {
          // Close trip
          console.log('Invoking CLOSE_TRIP (%s) with parameters %s, %s, %s', CLOSE_TRIP, timestamp, point, current_trip);
          client.query(CLOSE_TRIP, [timestamp, point, current_trip], function(err, result) {
            if (err) return context.fail("Failed to close trip due to " + err);

            client.query(PURGE_NONSENSE_TRIPS, [vehicle_id], function(err, result) {
              if (err) return context.fail("Failed to purge silly trips due to " + err);

              client.query(DELETE_DUPLICATE_TRIPS, [vehicle_id], function(err, result) {
                if (err) return context.fail("Failed to purge silly trips due to " + err);

                client.query(DELETE_ORPHANED_TRIP_DETAILS, [vehicle_id], function(err, result) {
                  if (err) return context.fail("Failed to purge silly trips due to " + err);

                  client.query(DELETE_ORPHANED_BADGES, [vehicle_id], function(err, result) {
                    if (err) return context.fail("Failed to purge silly trips due to " + err);

                    client.query(DELETE_ORPHANED_METRICS, [vehicle_id], function(err, result) {
                      if (err) return context.fail("Failed to purge silly trips due to " + err);

                      handle_record();
                    });
                  });
                });
              });
            });
          });
        } else if (!in_trip && !unshifted) {
          // Open trip
          console.log("Adding trip");
          client.query(ADD_TRIP, [vehicle_id, timestamp, point], function(err, result) {

            if (err) return context.fail("Failed to write trip due to " + err);

            console.log(result.rows)

            current_trip = result.rows[0].id;

            handle_record();
          });
        } else {
          // This is just a metric for an existing trip.
          handle_record();
        }
      });

      // Call context succeed after this function has been called once per record
      var record_complete = function() {
        try {
          client.end();
        } catch(e) {
          console.error("Failed to close postgres connection due to %s", e);
        }

        context.succeed();
      };

      var handle_record = function() {

        try {

          // Short-circuit if record doesn't look well-formed
          if (isNaN(parseFloat(record['odometer']))) return record_complete();

          console.log(require('util').inspect(record));

          //["timestamp","speed","odometer","soc","elevation","est_heading","est_lat","est_lng","power","shift_state","range","est_range","heading"]
          var shift_state = (record['shift_state'] && record['shift_state'] !== '' ? record['shift_state'] : 'O');

          console.log("client.query(INSERT_METRIC, [" +
              record['vehicle_id'] + "," +
              new Date(parseInt(record['timestamp'])).toISOString() + "," +
              (record['speed'] && record['speed'] !== '' ? record['speed'] : '-1' ) + "," +
              record['odometer'] + "," +
              record['soc'] + "," +
              record['elevation'] + "," +
              record['est_heading'] + "," +
              record['heading'] + "," +
              "POINT(" + record['est_lng'] + ' ' + record['est_lat'] + " " + record['elevation'] + ")" + "," +
              record['power'] + "," +
              shift_state + "," +
              record['range'] + "," +
              record['est_range'] + "," +
              current_trip +
            "]);");

          client.query(INSERT_METRIC, [
              record['vehicle_id'],
              new Date(parseInt(record['timestamp'])).toISOString(),
              (record['speed'] && record['speed'] !== '' ? record['speed'] : '-1' ),
              record['odometer'],
              record['soc'],
              record['elevation'],
              record['est_heading'],
              record['heading'],
              "POINT(" + record['est_lng'] + ' ' + record['est_lat'] + " " + record['elevation'] + ")",
              record['power'],
              shift_state,
              record['range'],
              record['est_range'],
              current_trip
            ],
          function(err, result) {
            if (err) console.error('Write failed due to %s', err);
            else console.log('wrote to postgres: %s', result);
            record_complete();
          });

        } catch(e) {
          console.error('lambda exception %s', e);
          record_complete();
        }
      };
    } catch(e) {
      context.fail("Fail due to " + e);
    }
  });
};