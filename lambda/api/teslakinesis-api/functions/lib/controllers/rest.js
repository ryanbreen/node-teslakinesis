var locations = require('./locations.js');
var metrics = require('./metrics.js');
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
    case 'metrics':
      metrics.respond(event, cb);
      break;
    default:
      cb("Invalid type");
  }
};