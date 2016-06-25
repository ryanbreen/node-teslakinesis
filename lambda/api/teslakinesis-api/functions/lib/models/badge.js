var DB_CREDS = require('../creds/db.js');
var Sequelize = require('sequelize')
var sequelize = DB_CREDS.sequelize;

var BadgeType = require('./badge_type.js');

var Badge = module.exports = sequelize.define('badge', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  vehicle_id: Sequelize.CHAR,
  trip_id: Sequelize.INTEGER,
  trip_detail_id: Sequelize.INTEGER,
  vehicle_telemetry_metric_id: Sequelize.INTEGER,
  badge_type_id: Sequelize.INTEGER,
  data: Sequelize.CHAR,
  created_at: Sequelize.TIME,
  updated_at: Sequelize.TIME
}, {
  tableName: 'badges',
  timestamps: false
});

Badge.belongsTo(BadgeType, { foreignKey: "badge_type_id" });