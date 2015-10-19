
var util = require('util');

var Badge = function() {
  this.last_issued = undefined;
  this.sql = [];
  this.param_values_renderers = [];
  this.value_index = 1;
};

var INSERT_BADGE = "INSERT INTO badges( \
            vehicle_id, trip_id, trip_detail_id, vehicle_telemetry_metric_id, \
            badge_type_id, data, created_at, updated_at) \
    VALUES ($%s, $%s, $%s, $%s, \
            $%s, $%s, NOW(), NOW());";

Badge.prototype.createSQL = function(metric, data) {
  if (!metric) return;

  // Check whether the last time we issued this badge was less than a minute ago.  We do this
  // so similar badges don't stack up on each other.
  if (this.last_issued && (this.last_issued - metric.timestamp) < (60 * 1000)) return;

  console.log(this.last_issued - metric.timestamp);

  this.last_issued = metric.timestamp;

  var this_obj = this;

  var increment_index = function() {
    return this_obj.value_index +=1;
  }

  this.sql.push(util.format(INSERT_BADGE, increment_index(), increment_index(),
    increment_index(), increment_index(), increment_index(), increment_index()));
  
  // We need to lazy evaluate trip detail since we don't have all the information we need until
  // trip detail is inserted.
  this.param_values_renderers.push(function(trip_detail) {
    return [
      trip_detail.vehicle_id,
      trip_detail.id,
      trip_detail.trip_detail_id,
      metric.id,
      this_obj.badge_type_id,
      data
    ];
  });
};

Badge.prototype.process_metric = function() {};
Badge.prototype.metrics_complete = function() {};

Badge.prototype.toSQL = function() {
  return this.sql.join('\n');
};

Badge.prototype.getSQLParams = function(trip_detail) {
  var rvalue = [];
  this.param_values_renderers.forEach(function(renderer) {
    rvalue = rvalue.concat(renderer(trip_detail));
  });
  return rvalue;
};

module.exports = Badge;