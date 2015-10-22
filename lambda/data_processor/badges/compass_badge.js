var util = require('util');
var _ = require('underscore');

var Badge = require('./badge.js');

var CompassDirectionalBadge = function() {
  Badge.call(this);
};

util.inherits(CompassDirectionalBadge, Badge);

CompassDirectionalBadge.prototype.createSQL = function() {
  // If only the stub version of the examplar metric is present, do not update badges.  This means the
  // trip had zero metrics.
  if (!this.exemplar_metric.id) return null;
  var this_obj = this;

  return function(client, trip_detail, cb) {

    trip_detail.logger.info({local_exemplar: this_obj.exemplar_metric}, "local exemplar for badge");

    client.query("SELECT * from badges where vehicle_id = $1 and badge_type_id = $2;", [trip_detail.vehicle_id, this_obj.badge_type_id], function(err, res) {

      if (err) {
        trip_detail.logger.error(err, "Failed to query for directional badge for superlative trip.");
        return cb(err);
      }

      if (res.rows.length === 0) {

        trip_detail.logger.info("Trip has no existing directional superlative badge.");

        // If this is the first trip to receive a location, set the badge now.
        client.query(this_obj.INSERT_BADGE, [
          this_obj.exemplar_metric.vehicle_id,
          this_obj.exemplar_metric.trip_id,
          trip_detail.trip_detail_id,
          this_obj.exemplar_metric.id,
          this_obj.badge_type_id,
          this_obj.data
        ], cb);
      } else {
        var current_exemplar = res.rows[0];
        
        // Create a dummy metric representing the current, global exemplar: the metric that earned the badge.
        var dummy_metric = {
          id: false,
          location: {
            coordinates: [ current_exemplar.data, current_exemplar.data ]
          }
        };

        trip_detail.logger.info({global_exemplar: current_exemplar}, "global exemplar for badge");

        // Send the dummy_metric through process_metric.  If it replaces this_obj's exemplar, it means that the current
        // metric is more exemplar than this one, so there's no need to update badges.
        this_obj.process_metric(dummy_metric);
        if (this_obj.exemplar_metric.id) {

          trip_detail.logger.info("Trip has a superlative coordinate of %s", this_obj.data);

          // Delete the existing badge
          client.query("DELETE from badges where vehicle_id = $1 and badge_type_id = $2;",  [trip_detail.vehicle_id, this_obj.badge_type_id], function(err, res) {

            if (err) {
              trip_detail.logger.error(err, "Failed to delete previous directional badge for superlative trip.");
              return cb(err);
            }

            // Finally, add our new badge
            client.query(this_obj.INSERT_BADGE, [
              this_obj.exemplar_metric.vehicle_id,
              this_obj.exemplar_metric.trip_id,
              trip_detail.trip_detail_id,
              this_obj.exemplar_metric.id,
              this_obj.badge_type_id,
              this_obj.data
            ], cb);

          });
        } else {
          cb();
        }
      }
    });
  };
};

var CompassWestBadge = function() {
  CompassDirectionalBadge.call(this);
  var this_obj = this;
  this.badge_type_id = 3;
  this.exemplar_metric = {
    id: false,
    location: {
      coordinates: [ 180 ]
    }
  };
};

util.inherits(CompassWestBadge, CompassDirectionalBadge);

CompassWestBadge.prototype.process_metric = function(metric) {
  if (metric.location.coordinates[0] < this.exemplar_metric.location.coordinates[0]) {
    this.exemplar_metric = metric;
    this.data = metric.location.coordinates[0];
  }
};

var CompassEastBadge = function() {
  CompassDirectionalBadge.call(this);
  this.badge_type_id = 4;
  this.exemplar_metric = {
    id: false,
    location: {
      coordinates: [ -180 ]
    }
  };
};

util.inherits(CompassEastBadge, CompassDirectionalBadge);

CompassEastBadge.prototype.process_metric = function(metric) {
  if (metric.location.coordinates[0] > this.exemplar_metric.location.coordinates[0]) {
    this.exemplar_metric = metric;
    this.data = metric.location.coordinates[0];
  }
};

var CompassNorthBadge = function() {
  CompassDirectionalBadge.call(this);
  this.badge_type_id = 5;
  this.exemplar_metric = {
    id: false,
    location: {
      coordinates: [ 0, -90 ]
    }
  };
};

util.inherits(CompassNorthBadge, CompassDirectionalBadge);

CompassNorthBadge.prototype.process_metric = function(metric) {
  if (metric.location.coordinates[1] > this.exemplar_metric.location.coordinates[1]) {
    this.exemplar_metric = metric;
    this.data = metric.location.coordinates[1];
  }
};

var CompassSouthBadge = function() {
  CompassDirectionalBadge.call(this);
  this.badge_type_id = 6;
  this.exemplar_metric = {
    id: false,
    location: {
      coordinates: [ 0, 90 ]
    }
  };
};

util.inherits(CompassSouthBadge, CompassDirectionalBadge);

CompassSouthBadge.prototype.process_metric = function(metric) {
  if (metric.location.coordinates[1] < this.exemplar_metric.location.coordinates[1]) {
    this.exemplar_metric = metric;
    this.data = metric.location.coordinates[1];
  }
};

var CompassBadge = function() {
  Badge.call(this);

  var west = new CompassWestBadge();
  var east = new CompassEastBadge();
  var north = new CompassNorthBadge();
  var south = new CompassSouthBadge();
  this.directionals = [ west, east, north, south ];
};

util.inherits(CompassBadge, Badge);

CompassBadge.prototype.process_metric = function(metric) {
  this.directionals.forEach(function(directional) {
    directional.process_metric(metric);
  });
};

CompassBadge.prototype.metrics_complete = function() {

  var this_obj = this;
  this_obj.directionals.forEach(function(directional) {
    var sql_fn = directional.createSQL();
    if (sql_fn) this_obj.sql_functions.push(sql_fn);
  });
};

module.exports = CompassBadge;
