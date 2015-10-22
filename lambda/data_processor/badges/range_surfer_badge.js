var util = require('util');

var Badge = require('./badge.js');

var RangeSurferBadge = function() {
  Badge.call(this);
  this.badge_type_id = 9;
  this.current_lowest_soc = 180;
};

util.inherits(RangeSurferBadge, Badge);

RangeSurferBadge.prototype.process_metric = function(metric) {
  if (metric.soc < 25 && metric.soc < this.current_lowest_soc) {
    this.current_metric = metric;
    this.current_lowest_soc = metric.soc;
  }
};

RangeSurferBadge.prototype.metrics_complete = function() {
  if (this.current_metric) {
    this.createSQL(this.current_metric, this.current_metric.soc);
  }
};

module.exports = RangeSurferBadge;