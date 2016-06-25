var DB_CREDS = require('../creds/db.js');
var Sequelize = require('sequelize')
var sequelize = DB_CREDS.sequelize;

var Trip = require('./trip.js');

var TripDetail = module.exports = sequelize.define('trip_detail', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  vehicle_id: Sequelize.CHAR,
  trip_id: Sequelize.INTEGER,
  detailed_route: Sequelize.TEXT,
  summary_route: Sequelize.TEXT,
  upper_left: Sequelize.TEXT,
  lower_right: Sequelize.TEXT,
  created_at: Sequelize.TIME,
  updated_at: Sequelize.TIME,
  true_duration: Sequelize.INTEGER
}, {
  tableName: 'trip_details',
  timestamps: false
});

TripDetail.belongsTo(Trip, { foreignKey : 'trip_id' });
Trip.hasOne(TripDetail, { foreignKey : 'trip_id' });