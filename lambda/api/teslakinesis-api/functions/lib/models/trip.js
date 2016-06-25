var DB_CREDS = require('../creds/db.js');
var Sequelize = require('sequelize')
var sequelize = DB_CREDS.sequelize;

var Trip = module.exports = sequelize.define('trip', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  vehicle_id: Sequelize.CHAR,
  start_time: Sequelize.TIME,
  end_time: Sequelize.TIME,
  start_location: Sequelize.GEOGRAPHY,
  end_location: Sequelize.GEOGRAPHY,
  created_at: Sequelize.TIME,
  updated_at: Sequelize.TIME,
  start_location_id: Sequelize.INTEGER,
  end_location_id: Sequelize.INTEGER
}, {
  tableName: 'trips',
  timestamps: false
});
