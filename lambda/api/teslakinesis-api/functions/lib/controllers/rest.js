/**
 * Provide an event that contains the following keys:
 *
 *   - operation: one of the operations in the switch statement below
 *   - tableName: required for operations that interact with DynamoDB
 *   - payload: a parameter to pass to the operation being performed
 */

var locations = require('./locations.js');
var trips = require('./trips.js');

module.exports.respond = function(event, cb) {

  console.log(event.type);

  switch (event.type) {
    case 'trips':
      trips.respond(event, cb);
      break;
    case 'locations':
      locations.respond(event, cb);
      break;
    default:
      cb("Invalid type");
  }
};