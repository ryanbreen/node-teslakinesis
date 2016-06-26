var DB_CREDS = require('../creds/db.js');
var Sequelize = require('sequelize')
var sequelize = DB_CREDS.sequelize;

var BadgeType = require('./badge_type.js');
var Metric = require('./metric.js');
var Trip = require('./trip.js');
var Vehicle = require('./vehicle.js');

var Badge = module.exports = sequelize.define('badge', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  data: Sequelize.CHAR
}, {
  timestamps: true,
  underscored: true
});

Badge.belongsTo(BadgeType);
Badge.belongsTo(Metric);
Badge.belongsTo(Trip);
Badge.belongsTo(Vehicle);
Trip.hasMany(Badge);