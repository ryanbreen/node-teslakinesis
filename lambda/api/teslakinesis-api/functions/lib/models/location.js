var DB_CREDS = require('../creds/db.js');
var Sequelize = require('sequelize')
var sequelize = DB_CREDS.sequelize;

var Location = module.exports = sequelize.define('location', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  vehicle_id: Sequelize.CHAR,
  name: Sequelize.CHAR,
  geolocation: Sequelize.GEOGRAPHY,
  created_at: Sequelize.TIME,
  updated_at: Sequelize.TIME
}, {
  tableName: 'locations',
  timestamps: false
});
