/**
 * Lib
 */

var rest = require("./controllers/rest");

module.exports.testRespond1 = function(event, cb) {

  var response = {
    test: event.test
  };

  return cb(null, response);
};

module.exports.testRespond2 = function(event, cb) {

  var response = {
    'var1_and_var2' : event.var1 + ' ' + event.var2
  };

  return cb(null, response);
};

module.exports.testRespond3 = function(event, cb) {

  var response = {
    'status of' : event.var3
  };

  return cb(null, response);
};

module.exports.testRespond4 = function(event, cb) {

  var response = {
    "key": event.key,
    "value": event.value
  };

  return cb(null, response);
};

module.exports.rest = rest.respond;