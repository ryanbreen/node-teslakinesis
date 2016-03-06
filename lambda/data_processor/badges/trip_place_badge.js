var util = require('util');
var _ = require('underscore');

var Badge = require('./badge.js');

var TripNumberedPlaceBadge = function() {
  Badge.call(this);
};

util.inherits(TripNumberedPlaceBadge, Badge);

TripNumberedPlaceBadge.prototype.createSQL = function(trip_detail, trip_id, data) {
  var this_obj = this;

  this.sql_functions.push(function(client, cb) {

    client.query("SELECT * from vehicle_telemetry_metrics where trip_id = $1 order by id DESC limit 1;", [trip_id], function(err, res) {

      if (err) {
        console.log("Failed to query for metrics for superlative trip.");
        console.log(err);
        return cb(err);
      }

      if (res.rows.length !== 1) {
        console.log("Incorrect number of metrics %s returned for superlative trip.", res.rows.length);
        return cb(err); 
      }

      console.log("Got metric for trip: %s", res.rows);

      var my_metric = res.rows[0];

      client.query("SELECT id from trip_details where trip_id = $1 limit 1;", [trip_id], function(err, res) {

        if (err) {
          console.log("Failed to query for trip_details for superlative trip.");
          console.log(err);
          return cb(err);
        }

        if (res.rows.length !== 1) {
          console.log("Incorrect number of trip_details returned for superlative trip. %s", res.rows.length);
          return cb(err); 
        }

        console.log("Got trip detail for trip: %s", res.rows);

        var my_trip_detail = res.rows[0];

        // After gathering the metric and trip_detail corresponding to the trip for which we must create this badge, 
        // we're finally ready to populate the badge.
        client.query(this_obj.INSERT_BADGE, [
          my_metric.vehicle_id,
          my_metric.trip_id,
          my_trip_detail.id,
          my_metric.id,
          this_obj.badge_type_id,
          data
        ], cb);
      });
    });
  });
};

var TripFirstPlaceBadge = function() {
  TripNumberedPlaceBadge.call(this);
  this.badge_type_id = 10;
};

util.inherits(TripFirstPlaceBadge, TripNumberedPlaceBadge);

var TripSecondPlaceBadge = function() {
  TripNumberedPlaceBadge.call(this);
  this.badge_type_id = 11;
};

util.inherits(TripSecondPlaceBadge, TripNumberedPlaceBadge);

var TripThirdPlaceBadge = function() {
  TripNumberedPlaceBadge.call(this);
  this.badge_type_id = 12;
};

util.inherits(TripThirdPlaceBadge, TripNumberedPlaceBadge);

var TripLastPlaceBadge = function() {
  TripNumberedPlaceBadge.call(this);
  this.badge_type_id = 13;
};

util.inherits(TripLastPlaceBadge, TripNumberedPlaceBadge);

var TripPlaceBadge = function() {
  Badge.call(this);
};

util.inherits(TripPlaceBadge, Badge);

TripPlaceBadge.prototype.metrics_complete = function() {

  this.sql_functions.push(function(client, trip_detail, cb) {

    client.query("SELECT t.*, td.true_duration from trips t, trip_details td where t.vehicle_id = $1 and t.start_location_id = $2 \
      and t.end_location_id = $3 and t.id = td.trip_id order by td.true_duration limit 4;", [
      trip_detail.vehicle_id,
      trip_detail.trip.start_location_id,
      trip_detail.trip.end_location_id
    ], function(err, top_trips) {
      if (err) {
        console.log("Failed to query for top trips due to %s", err);
        return cb(err);
      }

      var at_least_four = top_trips.rows.length === 4;
      var top_three_trips = top_trips.rows;

      // Pop off the 4th element so that there are really 3 trips.
      if (at_least_four) top_three_trips.pop();

      /**
       * Check to see if this trip is in the top 3.  If so, delete all current trip rank badges
       * for this route and create badges for the new 3.
       * matched = top_three_trips.select {|t| trip.id = t.id}
       * Make sure each trip has its trip_detail object initiated.  We want to do this before
       * adding badges or we will get into a weird loop where this badge is being created by
       * trips in the top_three_trips array after we've deleted dupes.
       */
      var matched = _.find(top_three_trips, function(t) { return t.id == trip_detail.id });
      if (matched) {
        client.query("DELETE from badges where vehicle_id = $1 and trip_id IN \
            (select id from trips where vehicle_id = $1 and start_location_id = $2 and end_location_id = $3) \
          and badge_type_id IN (10, 11, 12);", [
          trip_detail.vehicle_id,
          trip_detail.trip.start_location_id,
          trip_detail.trip.end_location_id
        ], function(err, top_trips) {
          if (err) {
            console.log("Failed to delete existing badges due to %s", err);
            return cb(err);
          }

          // Run our callback once all three trips are processed.
          var delayed_cb = _.after(3, cb);

          // A convenience method for the boilerplate necessary to create badges.
          var create_badge = function(my_trip, badge_ctor) {
            var my_badge = new badge_ctor();
            my_badge.createSQL(trip_detail, my_trip.id, Math.round(my_trip.true_duration/1000));
            my_badge.getSQLFunctions()[0](client, delayed_cb);
          };

          // Once we've cleared badge state, we need to create our new top three.
          create_badge(top_three_trips[0], TripFirstPlaceBadge);
          if (top_three_trips.length > 0) create_badge(top_three_trips[1], TripSecondPlaceBadge);
          if (top_three_trips.length > 1) create_badge(top_three_trips[2], TripThirdPlaceBadge);
        });
      } else {

        // If there are at least 4 trips (meaning, there's room for a top 3 and a last place),
        // calculate last place.
        if (at_least_four) {

          // Check to see if this is the slowest trip.  If so, delete any current trip
          // for this route badged as slowest and badge this one.
          client.query("SELECT t.*, td.true_duration from trips t, trip_details td \
            where t.vehicle_id = $1 and t.start_location_id = $2 and t.end_location_id = $3 and t.id = td.trip_id order by \
            td.true_duration DESC limit 1;", [
            trip_detail.vehicle_id,
            trip_detail.trip.start_location_id,
            trip_detail.trip.end_location_id
          ], function(err, oldest_trip_res) {
            if (err) {
              console.log("Failed to query for oldest trips due to %s", err);
              return cb(err);
            }

            var oldest_trip = oldest_trip_res.rows[0];
            if (oldest_trip.id == trip_detail.trip.id) {
              // Delete any previous slowest and create a badge
              client.query("DELETE from badges where vehicle_id = $1 and trip_id IN \
                              (select id from trips where vehicle_id = $1 and start_location_id = $2 and end_location_id = $3) \
                            and badge_type_id = 13;", [
                trip_detail.vehicle_id,
                trip_detail.trip.start_location_id,
                trip_detail.trip.end_location_id
              ], function(err, top_trips) {
                if (err) {
                  console.log("Failed to delete existing badges due to %s", err);
                  return cb(err);
                }

                var my_badge = new TripLastPlaceBadge();
                my_badge.createSQL(trip_detail, oldest_trip.id, Math.round(oldest_trip.true_duration/1000));
                my_badge.getSQLFunctions()[0](client, cb);
              });

            } else {
              // Nothing to be done.  This trip is not the slowest.
              cb();
            }
          });
        } else {
          // Nothing to be done.  Fire the callback.
          cb();
        }
      }
    });
  });
};

module.exports = TripPlaceBadge;
