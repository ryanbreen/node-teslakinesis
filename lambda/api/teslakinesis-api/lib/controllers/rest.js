console.log('Loading function');

/**
 * Provide an event that contains the following keys:
 *
 *   - operation: one of the operations in the switch statement below
 *   - tableName: required for operations that interact with DynamoDB
 *   - payload: a parameter to pass to the operation being performed
 */

var Trip = require('../models/trip');

module.exports.respond = function(event, cb) {

  var response = {
    'method' : event.httpmethod,
    'key' : event.key,
    'value' : event.value
  };

  switch (response.method) {
    case 'POST':
      break;
    case 'GET':
      if (event.key) {
      } else {
        Trip.findAll().then(function (trips) {
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