var DB_CREDS = require('../creds/db.js');
var Sequelize = require('sequelize')
var sequelize = DB_CREDS.sequelize;

var Vehicle = module.exports = sequelize.define('vehicle', {
  id: {
    type: Sequelize.CHAR,
    primaryKey: true
  },
  name: Sequelize.CHAR
}, {
  timestamps: true,
  underscored: true
});
