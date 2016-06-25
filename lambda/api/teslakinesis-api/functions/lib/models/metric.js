var DB_CREDS = require('../creds/db.js');
var Sequelize = require('sequelize')
var sequelize = DB_CREDS.sequelize;

var Metric = module.exports = sequelize.define('metric', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  vehicle_id: Sequelize.CHAR,
  timestamp: Sequelize.TIME,
  speed: Sequelize.INTEGER,
  odometer: Sequelize.DOUBLE,
  soc: Sequelize.INTEGER,
  elevation: Sequelize.INTEGER,
  heading: Sequelize.INTEGER,
  location: Sequelize.GEOGRAPHY,
  power: Sequelize.INTEGER,
  shift_state: Sequelize.CHAR,
  range: Sequelize.INTEGER,
  est_range: Sequelize.INTEGER,
  created_at: Sequelize.TIME,
  updated_at: Sequelize.TIME,
  trip_id: Sequelize.INTEGER
}, {
  tableName: 'vehicle_telemetry_metrics',
  timestamps: false
});
