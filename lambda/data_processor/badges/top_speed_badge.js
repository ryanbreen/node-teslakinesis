var util = require('util');

var Badge = require('./badge.js');

var TopSpeedBadge = function() {
  Badge.call(this);
  this.badge_type_id = 7;
  this.top_speed = 0;
  this.current_metric = undefined;
};

util.inherits(TopSpeedBadge, Badge);

TopSpeedBadge.prototype.process_metric = function(metric) {
  if (metric.speed > this.top_speed) {
    this.top_speed = metric.speed;
    this.current_metric = metric;
  }
};

TopSpeedBadge.prototype.metrics_complete = function() {
  var this_obj = this;

  this.sql_functions.push(function(client, trip_detail, cb) {

    client.query("SELECT * from badges where badge_type_id = 7 and vehicle_id = $1;", [trip_detail.vehicle_id], function(err, res) {

      if (err) {
        trip_detail.logger.error(err, "Failed to query for fastest trip badge.");
        return cb(err);
      }

      trip_detail.logger.info({rows: res.rows}, "Current top speed badge");

      if (res.rows.length === 0) {
        // Assume this is the first badge for this trip.
        client.query(this_obj.INSERT_BADGE, [
          trip_detail.vehicle_id,
          trip_detail.id,
          trip_detail.trip_detail_id,
          this_obj.current_metric.id,
          this_obj.badge_type_id,
          this_obj.top_speed
        ], cb);
      } else {

        badge = res.rows[0];

        trip_detail.logger.info({current_top_speed: this_obj.top_speed, global_top_speed : badge.data}, "Is this the new top speed?");

        // if this is the fastest we've gone, delete any prior badge for this vehicle
        if (this_obj.top_speed > badge.data) {
          client.query("DELETE from badges where badge_type_id = 7 and vehicle_id = $1;", [trip_detail.vehicle_id], function(err, res) {

            if (err) {
              trip_detail.logger.error(err, "Failed to delete fastest trip badge.");
              return cb(err);
            }

            client.query(this_obj.INSERT_BADGE, [
              trip_detail.vehicle_id,
              trip_detail.id,
              trip_detail.trip_detail_id,
              this_obj.current_metric.id,
              this_obj.badge_type_id,
              this_obj.top_speed
            ], cb);
          });
        } else {
          // Otherwise, do nothing.
          cb();
        }
      }
    });
  });
};

module.exports = TopSpeedBadge;
