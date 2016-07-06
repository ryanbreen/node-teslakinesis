var DB_CREDS = require('../creds/db.js');
var Sequelize = require('sequelize')
var sequelize = DB_CREDS.sequelize;

var Location = require('./location.js');
var Vehicle = require('./vehicle.js');

var Trip = module.exports = sequelize.define('trip', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  start_time: Sequelize.DATE,
  end_time: Sequelize.DATE,
  start_location: Sequelize.GEOGRAPHY,
  end_location: Sequelize.GEOGRAPHY,
  detailed_route: Sequelize.TEXT,
  summary_route: Sequelize.TEXT,
  upper_left: Sequelize.TEXT,
  lower_right: Sequelize.TEXT,
  true_duration: Sequelize.INTEGER
}, {
  timestamps: true,
  underscored: true
});

Trip.belongsTo(Location, { foreignKey: 'start_location_id' });
Trip.belongsTo(Location, { foreignKey: 'end_location_id' });