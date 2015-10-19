
var Badge = function() {
  this.last_issued = 4611686018427387903;
};

Badge.create = function(trip_detail, metric, data) {
  if (!metric) return;

  // Check whether the last time we issued this badge was less than a minute ago.  We do this
  // so similar badges don't stack up on each other.
  if ((this.last_issued - metric.timestamp) < 60) return;

  this.last_issued = metric.timestamp;

  console.log('Issuing speed demon badge');

/**
  Badge.create(
    :vehicle_id => trip_detail.vehicle_id,
    :trip_id => trip_detail.trip_id,
    :trip_detail_id => trip_detail.id,
    :vehicle_telemetry_metric_id => metric.id,
    :badge_type_id => id,
    :data => data
  )
**/
};

module.exports = Badge;