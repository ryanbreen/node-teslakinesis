/**
 * Provide an event that contains the following keys:
 *
 *   - operation: one of the operations in the switch statement below
 *   - tableName: required for operations that interact with DynamoDB
 *   - payload: a parameter to pass to the operation being performed
 */

var Trip = require('../models/trip.js');
var TripDetail = require('../models/trip_detail.js');

const PAGE_SIZE = 10;

module.exports.respond = function(event, cb) {

  switch (event.httpmethod) {
    case 'POST':
      break;
    case 'GET':
      if (event.id) {
        console.log("Looking for trip %s for vehicle %s", event.id, event.vehicle_id);
        Trip.findOne({
          where: { vehicle_id : event.vehicle_id, id: event.id },
          include: [{
            model: TripDetail
          }]
        }).then(function (trip) {
          return cb(null, trip);
        });
      } else {
        if (!event.page) {
          event.page = 1;
        }

        var where = { vehicle_id : event.vehicle_id };
        var include_where = {  };

        if (event.filter == 'unsummarized') {
          include_where.trip_id = null;
        }

        Trip.findAll({
          where: where,
          order: 'id DESC',
          limit: PAGE_SIZE,
          offset: event.page * PAGE_SIZE,
          include: [{
            model: TripDetail,
            where: include_where,
            required: false
          }]
        }).then(function (trips) {
          return cb(null, trips);
        });
      }
      break;
    case 'PUT':
      break;
    case 'DELETE':
      break;
    default:
  }
};