/**
 * Provide an event that contains the following keys:
 *
 *   - operation: one of the operations in the switch statement below
 *   - tableName: required for operations that interact with DynamoDB
 *   - payload: a parameter to pass to the operation being performed
 */

var Trip = require('../models/trip.js');
var TripDetail = require('../models/trip_detail.js');

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
        Trip.findAll({
          where: { vehicle_id : event.vehicle_id },
          order: 'id DESC',
          include: [{
            model: TripDetail
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