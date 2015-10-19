var util = require('util');

var Badge = require('./badge.js');

var AwesomePowerBadge = function() {
  Badge.call(this);
  this.badge_type_id = 2;
};

util.inherits(AwesomePowerBadge, Badge);

AwesomePowerBadge.prototype.process_metric = function(metric) {
  if (metric.power > 220) {
    this.createSQL(metric, metric.power);
  }
};

module.exports = AwesomePowerBadge;