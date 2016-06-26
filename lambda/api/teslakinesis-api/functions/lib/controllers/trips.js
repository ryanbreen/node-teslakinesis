/**
 * Provide an event that contains the following keys:
 *
 *   - operation: one of the operations in the switch statement below
 *   - tableName: required for operations that interact with DynamoDB
 *   - payload: a parameter to pass to the operation being performed
 */

var Metric = require('../models/metric.js');
var Badge = require('../models/badge.js');
var BadgeType = require('../models/badge_type.js');
var Trip = require('../models/trip.js');

const PAGE_SIZE = 10;
const METRIC_PAGE_SIZE = 1000;

module.exports.respond = function(event, cb) {

  console.log(event);

  switch (event.httpmethod) {
    case 'POST':
      break;
    case 'GET':
      if (!event.page) {
        event.page = 0;
      }

      switch (event.mode) {
        case 'badges':
          Badge.findAll({
            where: { vehicle_id : event.vehicle_id, trip_id: event.id },
            order: 'id DESC',
            include: [{
              model: BadgeType
            }]
          }).then(function (badges) {
            return cb(null, badges);
          });
          break;
        case 'metrics':
          Metric.findAll({
            where: { vehicle_id : event.vehicle_id, trip_id: event.id },
            order: 'id DESC',
            limit: METRIC_PAGE_SIZE,
            offset: event.page * METRIC_PAGE_SIZE,
          }).then(function (metrics) {
            return cb(null, metrics);
          });
          break;
        case 'show':
          Trip.findOne({
            where: { vehicle_id : event.vehicle_id, id: event.id }
          }).then(function (trip) {
            return cb(null, trip);
          });
          break;
        case 'index':
          Trip.findAll({
            where: { vehicle_id : event.vehicle_id },
            order: 'id DESC',
            limit: PAGE_SIZE,
            offset: event.page * PAGE_SIZE
          }).then(function (trips) {
            return cb(null, trips);
          });
          break;
        default:
          console.log("oops, mode %s not found", event.mode);
      }
      break;
    case 'PUT':
      break;
    case 'DELETE':
      break;
    default:
  }
};