var AWS = require('aws-sdk');
var crypto = require('crypto');
var pg = require('pg');
var _ = require('underscore');

var INSERT_METRIC =
  "INSERT INTO vehicle_telemetry_metrics(id, vehicle_id, timestamp, speed, odometer, soc, elevation, " +
    "est_heading, heading, location, power, shift_state, range, est_range, created_at, updated_at) " +
    "VALUES (DEFAULT, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, now(), now());"
var ADD_TRIP =
  "INSERT INTO trips(id, vehicle_id, start_time, end_time, start_location, end_location, created_at, updated_at) " +
    "VALUES (DEFAULT, $1, $2, NULL, $3, $3, now(), now()) RETURNING id;"
var CURRENT_TRIP = "SELECT id from trips where vehicle_id = $1 and end_time = NULL;"
var CLOSE_TRIP = "UPDATE trips set end_time = $1, end_location = $2, updated_at = now() where id = $3;";

var creds = require('./creds/db.js');

exports.handler = function(event, context) {

  if (event.Records.length === 0) return context.succeed();

  var conn_string = "postgres://" + creds.DB_USER + ":" + creds.DB_PASSWORD + "@tesla.cfwzoyel2syn.us-east-1.rds.amazonaws.com/tesla";
  pg.connect(conn_string, function(err, client, done) {

    try {
      if (err) return context.fail(err);

      // A trip starts when the car shifts into gear after previously not being in gear.
      // A trip ends when the car shifts out of gear after previously being in gear.
      var current_trip;
      var trip_transition_operations = [];

      // All records are the same vehicle_id, so pull one from the first record.
      // TODO: Make this more robust.
      var vehicle_id = JSON.parse(new Buffer(event.Records[0].kinesis.data, 'base64').toString('ascii')).vehicle_id;

      // Find current trip.  If none and car is in gear, create a new trip.
      client.query(CURRENT_TRIP, [vehicle_id], function(err, result) {
        if (err) {
          console.error('Trip query failed due to %s', err);
          return context.fail(err);
        }

        var in_trip = result.rows.length > 0;
        console.log("Starting state in_trip? %s", in_trip);

        current_trip = in_trip && result.rows[0].id;

        event.Records.forEach(function(record) {

          var payload = JSON.parse(new Buffer(record.kinesis.data, 'base64').toString('ascii'));

          if (isNaN(parseFloat(payload['odometer']))) return;

          var timestamp = new Date(parseInt(payload['timestamp'])).toISOString();
          var unshifted = payload.shift_state === '';

          var operation = {
            'time': timestamp,
            'lat': payload['est_lat'],
            'lng': payload['est_lng'],
            'elevation': payload['elevation']
          };

          console.log("in_trip = %s, shift_state = %s, unshifted = %s", in_trip, payload['shift_state'], unshifted);
          if (unshifted && in_trip) {
            // Close trip
            operation.type = 'close';
            trip_transition_operations.push(operation);

            in_trip = false;
          } else if (!in_trip && !unshifted) {
            // Open trip
            operation.type = 'open';
            trip_transition_operations.push(operation);
            in_trip = true;
          }
        });

        console.log(trip_transition_operations);

        var process_trip_op = function() {
          // Process each transition
          if (trip_transition_operations.length === 0) {
            return event.Records.forEach(handle_record); 
          }

          var trip_op = trip_transition_operations.shift();
          var point = "POINT(" + trip_op['lng'] + ' ' + trip_op['lat'] + " " + trip_op['elevation'] + ")";
          if (trip_op.type === 'open') {
            // Find current trip.  If none and car is in gear, create a new trip.
            console.log("Adding trip");
            client.query(ADD_TRIP, [vehicle_id, trip_op['time'], point], function(err, result) {
              if (err) return context.fail("Failed to write trip due to " + err);

              console.log(result.rows)

              current_trip = result.rows[0].id;
              process_trip_op();
            });
          } else if (trip_op.type === 'close') {
            console.log("Closing trip %s", current_trip);
            // Find current trip.  If none and car is in gear, create a new trip.
            client.query(CLOSE_TRIP, [trip_op['time'], point, current_trip], function(err, result) {
              if (err) return context.fail("Failed to close trip due to " + err);
              process_trip_op();
            });
          } else {
            context.fail("Invalid trip_op type");
          }
        };

        process_trip_op();

      });

      // Call context succeed after this function has been called once per record
      var record_complete = _.after(event.Records.length, function() {
        try {
          client.end();
        } catch(e) {
          console.error("Failed to close postgres connection due to %s", e);
        }

        context.succeed();
      });

      var handle_record = function(record) {
        try {
          // Kinesis data is base64 encoded so decode here
          payload = JSON.parse(new Buffer(record.kinesis.data, 'base64').toString('ascii'));

          // Short-circuit if record doesn't look well-formed
          if (isNaN(parseFloat(payload['odometer']))) return record_complete();

          console.log(require('util').inspect(payload));

          //["timestamp","speed","odometer","soc","elevation","est_heading","est_lat","est_lng","power","shift_state","range","est_range","heading"]

          var shift_state = (payload['shift_state'] && payload['shift_state'] !== '' ? payload['shift_state'] : 'O');

          client.query(INSERT_METRIC, [
              payload['vehicle_id'],
              new Date(parseInt(payload['timestamp'])).toISOString(),
              (payload['speed'] && payload['speed'] !== '' ? payload['speed'] : '-1' ),
              payload['odometer'],
              payload['soc'],
              payload['elevation'],
              payload['est_heading'],
              payload['heading'],
              "POINT(" + payload['est_lng'] + ' ' + payload['est_lat'] + " " + payload['elevation'] + ")",
              payload['power'],
              shift_state,
              payload['range'],
              payload['est_range']
            ],
          function(err, result) {
            if (err) console.error('Write failed due to %s', err);
            else console.log('wrote to postgres: %s', result);
            record_complete();
          });

        } catch(e) {
          if (err) console.error('lambda exception %s', e);
          record_complete();
        }
      };
    } catch(e) {
      context.fail("Fail due to " + e);
    }
  });
};