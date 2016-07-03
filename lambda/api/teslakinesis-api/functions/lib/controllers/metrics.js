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
        return cb(null, { location: "/" + metric.vehicle_id + "/metrics/" + metric.id });
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