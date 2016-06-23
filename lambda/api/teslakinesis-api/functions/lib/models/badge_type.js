var DB_CREDS = require('../creds/db.js');
var Sequelize = require('sequelize');
var sequelize = new Sequelize(DB_CREDS.URI);

var BadgeType = module.exports = sequelize.define('badge_type', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: Sequelize.CHAR,
  description: Sequelize.CHAR,
  icon: Sequelize.CHAR,
  flavor: Sequelize.CHAR,
  created_at: Sequelize.TIME,
  updated_at: Sequelize.TIME,
  type: Sequelize.CHAR,
}, {
  tableName: 'badge_types',
  timestamps: false
});