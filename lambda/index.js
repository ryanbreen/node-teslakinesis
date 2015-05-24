var AWS = require('aws-sdk');

var INSERT_METRIC =
  "INSERT INTO vehicle_telemetry_metrics(id, timestamp, speed, odometer, soc, elevation, est_heading, heading, location, power, shift_state, range, est_range) " +
                                "VALUES (DEFAULT, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);"

exports.handler = function(event, context) {

  // connect to DB
  var pg = require('pg');
  var conn_string = "postgres://wrb:" + process.env.DB_PASSWORD + "@tesla.cfwzoyel2syn.us-east-1.rds.amazonaws.com/tesla";

  pg.connect(conn_string, function(err, client, done) {

    if (err) return context.fail(err);

    event.Records.forEach(function(record) {
      // Kinesis data is base64 encoded so decode here
      payload = JSON.parse(new Buffer(record.kinesis.data, 'base64').toString('ascii'));

      //["timestamp","speed","odometer","soc","elevation","est_heading","est_lat","est_lng","power","shift_state","range","est_range","heading"]
      console.log(new Date(parseInt(payload['timestamp'])).toISOString());

      client.query(INSERT_METRIC, [
          new Date(parseInt(payload['timestamp'])).toISOString(),
          (payload['speed'] && payload['speed'] !== '' ? payload['speed'] : '-1' ),
          payload['odometer'],
          payload['soc'],
          payload['elevation'],
          payload['est_heading'],
          payload['heading'],
          //'POINT(' + payload['est_lat'] + ' ' + payload['est_lng'] + ')',
          "(" + payload['est_lat'] + ',' + payload['est_lng'] + ")",
          payload['power'],
          (payload['shift_state'] && payload['shift_state'] !== '' ? payload['shift_state'] : 'O'),
          payload['range'],
          payload['est_range']
        ],
      function(err, result) {
        if (err) return context.fail(err);
        console.log('wrote to postgres: %s', result);
        context.succeed();
      });
    });
  });
};