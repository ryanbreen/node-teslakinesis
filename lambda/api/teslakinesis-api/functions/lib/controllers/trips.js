/**
 * Provide an event that contains the following keys:
 *
 *   - operation: one of the operations in the switch statement below
 *   - tableName: required for operations that interact with DynamoDB
 *   - payload: a parameter to pass to the operation being performed
 */

var Metric = require('../models/metric.js');
var Trip = require('../models/trip.js');
var TripDetail = require('../models/trip_detail.js');

const PAGE_SIZE = 10;
const METRIC_PAGE_SIZE = 1000;

module.exports.respond = function(event, cb) {

  switch (event.httpmethod) {
    case 'POST':
      break;
    case 'GET':
      if (event.id) {
        if (event.path == 'metrics') {
          Metric.findAll({
            where: { vehicle_id : event.vehicle_id, trip_id: event.id },
            order: 'id DESC',
            limit: METRIC_PAGE_SIZE,
            offset: event.page * METRIC_PAGE_SIZE,
          }).then(function (metrics) {
            return cb(null, metrics);
          });
        } else {
          console.log("Looking for trip %s for vehicle %s", event.id, event.vehicle_id);
          Trip.findOne({
            where: { vehicle_id : event.vehicle_id, id: event.id },
            include: [{
              model: TripDetail
            }]
          }).then(function (trip) {
            return cb(null, trip);
          });
        }
      } else {
        if (!event.page) {
          event.page = 1;
        }

        var where = { vehicle_id : event.vehicle_id };
        var include_where = {  };

        if (event.path == 'unsummarized') {
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