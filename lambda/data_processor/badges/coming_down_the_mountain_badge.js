var util = require('util');

var Badge = require('./badge.js');

var ComingDownTheMountainBadge = function() {
  Badge.call(this);
  this.badge_type_id = 8;
};

util.inherits(ComingDownTheMountainBadge, Badge);

ComingDownTheMountainBadge.prototype.process_metric = function(metric) {
  if (metric.power < -60) {
    this.createSQL(metric, metric.power);
  }
};

module.exports = ComingDownTheMountainBadge;