var AWS = require('aws-sdk');
var crypto = require('crypto');
var pg = require('pg');
var _ = require('underscore');

var INSERT_METRIC =
  "INSERT INTO vehicle_telemetry_metrics(id, vehicle_id, timestamp, speed, odometer, soc, elevation, est_heading, heading, location, power, shift_state, range, est_range, created_at, updated_at) " +
                                "VALUES (DEFAULT, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15);"

var creds = require('./creds/db.js');

exports.handler = function(event, context) {

  if (event.Records.length === 0) return context.succeed();

  var conn_string = "postgres://" + creds.DB_USER + ":" + creds.DB_PASSWORD + "@tesla.cfwzoyel2syn.us-east-1.rds.amazonaws.com/tesla";

  pg.connect(conn_string, function(err, client, done) {

    if (err) return context.fail(err);

    // Call context succeed after this function has been called once per record
    var process_records = _.after(event.Records.length, function() {
      context.succeed();
    });

    event.Records.forEach(function(record) {

      try {
        // Kinesis data is base64 encoded so decode here
        payload = JSON.parse(new Buffer(record.kinesis.data, 'base64').toString('ascii'));

        // Short-circuit if record doesn't look well-formed
        if (isNaN(parseFloat(payload['odometer']))) return process_records();

        console.log(require('util').inspect(payload));

        //["timestamp","speed","odometer","soc","elevation","est_heading","est_lat","est_lng","power","shift_state","range","est_range","heading"]
        console.log(new Date(parseInt(payload['timestamp'])).toISOString());

        var now = new Date().toISOString();

        client.query(INSERT_METRIC, [
            payload['vehicle_id'],
            new Date(parseInt(payload['timestamp'])).toISOString(),
            (payload['speed'] && payload['speed'] !== '' ? payload['speed'] : '-1' ),
            payload['odometer'],
            payload['soc'],
            payload['elevation'],
            payload['est_heading'],
            payload['heading'],
            //"(" + payload['est_lat'] + ',' + payload['est_lng'] + ")",
            "POINT(" + payload['est_lng'] + ' ' + payload['est_lat'] + " " + payload['elevation'] + ")",
            // "(" + payload['est_lat'] + ',' + payload['est_lng'] + ',' + payload['elevation'] + ")",
            payload['power'],
            (payload['shift_state'] && payload['shift_state'] !== '' ? payload['shift_state'] : 'O'),
            payload['range'],
            payload['est_range'],
            now,
            now
          ],
        function(err, result) {
          if (err) console.error('Write failed due to %s', err);
          else console.log('wrote to postgres: %s', result);
          process_records();
        });
      } catch(e) {
        if (err) console.error('lambda exception %s', e);
        process_records();
      }
    });
  });
};