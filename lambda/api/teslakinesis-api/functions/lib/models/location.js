var DB_CREDS = require('../creds/db.js');
var Sequelize = require('sequelize')
var sequelize = DB_CREDS.sequelize;

var Vehicle = require('./vehicle.js');

var Location = module.exports = sequelize.define('location', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: Sequelize.CHAR,
  geolocation: Sequelize.GEOGRAPHY
}, {
  timestamps: true,
  underscored: true
});

Location.belongsTo(Vehicle);
