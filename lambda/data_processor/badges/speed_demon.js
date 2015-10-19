var Badge = require('./badge.js');

var SpeedDemonBadge = function() {
  this.badge_type_id = 1;
};

SpeedDemonBadge.prototype = new Badge();

SpeedDemonBadge.prototype.process_metrics = function(trip_detail, metric) {
  if (metric.speed > 90) {
    this.create_badge(trip_detail, metric, metric.speed);
  }
};

module.exports = SpeedDemonBadge;