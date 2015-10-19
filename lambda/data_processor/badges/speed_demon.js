

module.exports.process_metrics = function(trip_detail, metric) {
  if (metric.speed > 90) {
    create_badge(trip_detail, metric, metric.speed);
  }
};
