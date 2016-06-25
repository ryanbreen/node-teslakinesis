/**
 * Provide an event that contains the following keys:
 *
 *   - operation: one of the operations in the switch statement below
 *   - tableName: required for operations that interact with DynamoDB
 *   - payload: a parameter to pass to the operation being performed
 */

var Metric = require('../models/metric.js');

const PAGE_SIZE = 10;

module.exports.respond = function(event, cb) {

  switch (event.httpmethod) {
    case 'POST':

      var now = new Date();

      // Make sure we exclusively trust the value in the path
      event.body.vehicle_id = event.vehicle_id;
      event.body.created_at = now;
      event.body.updated_at = now;

      Metric.create(event.body).then(function(metric) {
        return cb(null, { Location: metric.id });
      });

      break;
    case 'GET':
      if (event.id) {
        Metric.findOne({
          where: { vehicle_id : event.vehicle_id, id: event.id }
        }).then(function (metric) {
          return cb(null, metric);
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