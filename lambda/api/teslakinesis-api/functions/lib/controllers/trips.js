/**
 * Provide an event that contains the following keys:
 *
 *   - operation: one of the operations in the switch statement below
 *   - tableName: required for operations that interact with DynamoDB
 *   - payload: a parameter to pass to the operation being performed
 */

var Trip = require('../models/trip');

module.exports.respond = function(event, cb) {

  switch (event.httpmethod) {
    case 'POST':
      break;
    case 'GET':
      if (event.id) {
        Trip.findOne({ where: { vehicle_id : event.vehicle_id, id: event.id } }).then(function (trip) {
          return cb(null, trip);
        });
      } else {
        Trip.findAll({ where: { vehicle_id : event.vehicle_id }, order: 'id DESC' }).then(function (trips) {
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