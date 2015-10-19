var util = require('util');

var Badge = require('./badge.js');

var SpeedDemonBadge = function() {
  Badge.call(this);
  this.badge_type_id = 1;
};

util.inherits(SpeedDemonBadge, Badge);

SpeedDemonBadge.prototype.process_metric = function(metric) {
  if (metric.speed > 90) {
    this.createSQL(metric, metric.speed);
  }
};

module.exports = SpeedDemonBadge;