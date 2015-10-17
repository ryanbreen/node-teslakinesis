var AWS = require('aws-sdk');
var crypto = require('crypto');
var pg = require('pg');
var _ = require('underscore');

var db_creds = require('./creds/db.js');
var logentries_creds = require('./creds/logentries.js');

var bunyan = require('bunyan');
var bunyanLogentries = require('bunyan-logentries');

//var le = require('le_node');
//var logger = new le({token: logentries_creds.TOKEN});
var logentries_stream = bunyanLogentries.createStream({token: logentries_creds.TOKEN});
var logger = module.exports.logger = bunyan.createLogger({
  name: 'skunkworks',
  streams: [{
    level: 'debug',
    stream: logentries_stream,
    type: 'raw'
  }]
});

var flushed = false;
logentries_stream['_logger'].on('connect', function() {
  console.log('Connection made!');
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

var GET_METRICS_FOR_TRIP = "select * from vehicle_telemetry_metrics where trip_id = $1;";

function calculateTripDetail(trip_id, cb) {
  logger.info({trip_id: trip_id}, "Calculating trip detail");
  cb();
}

exports.handler = function(record, context) {

  var conn_string = "postgres://" + db_creds.DB_USER + ":" + db_creds.DB_PASSWORD + "@teslaprime.cfwzoyel2syn.us-east-1.rds.amazonaws.com/tesla";
  pg.connect(conn_string, function(err, client, done) {

    try {
      if (err) return complete(err);

      // If we were provided a trip_id, process it for metrics.  If not, look for a trip to process.
      if (record && record.trip_id) {
        calculateTripDetail(record.trip_id, function(err) {
          complete(err, context);
        });
      }

    } catch(e) {
      context.fail("Fail due to " + e);
    }
  });
};