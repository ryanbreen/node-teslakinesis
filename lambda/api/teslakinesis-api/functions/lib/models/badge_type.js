var DB_CREDS = require('../creds/db.js');
var Sequelize = require('sequelize')
var sequelize = DB_CREDS.sequelize;

var BadgeType = module.exports = sequelize.define('badge_type', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: Sequelize.CHAR,
  description: Sequelize.CHAR,
  icon: Sequelize.CHAR,
  flavor: Sequelize.CHAR
}, {
  timestamps: true,
  underscored: true
});