var DB_CREDS = require('../creds/db.js');
var Sequelize = require('sequelize');
var sequelize = new Sequelize(DB_CREDS.URI);

var Trip = sequelize.define('trip', {
  id: Sequelize.BIGINT,
  vehicle_id: Sequelize.CHAR,
  start_time: Sequelize.TIME,
  end_time: Sequelize.TIME,
  start_location: Sequelize.GEOGRAPHY,
  end_location: Sequelize.GEOGRAPHY,
  created_at: Sequelize.TIME,
  updated_at: Sequelize.TIME,
  start_location_id: Sequelize.INTEGER,
  end_location_id: Sequelize.INTEGER
});

Trip.findOne().then(function (trip) {
  console.log(trip);
});
