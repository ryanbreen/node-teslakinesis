var DB_CREDS = require('../creds/db.js');
var Sequelize = require('sequelize')
var sequelize = DB_CREDS.sequelize;

var Trip = require('./trip.js');
var Vehicle = require('./vehicle.js');

var Metric = module.exports = sequelize.define('metric', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
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
  est_range: Sequelize.INTEGER
}, {
  timestamps: true,
  underscored: true
});

Metric.belongsTo(Trip);
Metric.belongsTo(Vehicle);
Trip.hasMany(Metric);