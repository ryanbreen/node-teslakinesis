'use strict';

// Require Serverless ENV vars
var ServerlessHelpers = require('serverless-helpers-js').loadEnv();

// Require Logic
var lib = require('../lib');

// Lambda Handler
module.exports.trips = function(event, context) {
  lib.rest(event, function(error, response) {
    return context.done(error, response);
  });
};