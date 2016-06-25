
// Make sure all models are defined in sequelize
require('../models/');

var sequelize = require('../creds/db.js').sequelize;
sequelize.sync(function(err, done) {
  console.log(err);
  console.log(done);
});
