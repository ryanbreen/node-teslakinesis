/**
 * Provide an event that contains the following keys:
 *
 *   - operation: one of the operations in the switch statement below
 *   - tableName: required for operations that interact with DynamoDB
 *   - payload: a parameter to pass to the operation being performed
 */

var Location = require('../models/location.js');

const PAGE_SIZE = 10;

module.exports.respond = function(event, cb) {

  switch (event.httpmethod) {
    case 'POST':
      break;
    case 'GET':
      if (event.id) {
        Location.findOne({
          where: { vehicle_id : event.vehicle_id, id: event.id }
        }).then(function (location) {
          return cb(null, location);
        });
      } else {
        if (!event.page) {
          event.page = 1;
        }

        Location.findAll({
          where: { vehicle_id : event.vehicle_id },
          order: 'id DESC',
          limit: PAGE_SIZE,
          offset: event.page * PAGE_SIZE
        }).then(function (locations) {
          return cb(null, locations);
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