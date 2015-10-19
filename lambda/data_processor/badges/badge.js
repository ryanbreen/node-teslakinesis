
var util = require('util');

var Badge = function() {
  this.last_issued = undefined;
  this.sql_functions = [];
};

var INSERT_BADGE = "INSERT INTO badges( \
            vehicle_id, trip_id, trip_detail_id, vehicle_telemetry_metric_id, \
            badge_type_id, data, created_at, updated_at) \
    VALUES ($1, $2, $3, $4, \
            $5, $6, NOW(), NOW());";

Badge.prototype.createSQL = function(metric, data) {
  if (!metric) return;

  // Check whether the last time we issued this badge was less than a minute ago.  We do this
  // so similar badges don't stack up on each other.
  if (this.last_issued && (this.last_issued - metric.timestamp) < (60 * 1000)) return;

  this.last_issued = metric.timestamp;

  var this_obj = this;

  // We need to lazy evaluate the SQL counter since the parameters index might increase as a result
  // of badges added of this type or of other types, so the param counter is global to this invocation.
  this.sql_functions.push(function(client, trip_detail, cb) {
    client.query(INSERT_BADGE, [
      trip_detail.vehicle_id,
      trip_detail.id,
      trip_detail.trip_detail_id,
      metric.id,
      this_obj.badge_type_id,
      data
    ], cb);
  });
};

Badge.prototype.process_metric = function() {};
Badge.prototype.metrics_complete = function() {};

Badge.prototype.getSQLFunctions = function() {
  return this.sql_functions;
};

module.exports = Badge;