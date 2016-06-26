var DB_CREDS = require('../creds/db.js');
var Sequelize = require('sequelize')
var sequelize = DB_CREDS.sequelize;

var Vehicle = require('./vehicle.js');

var User = module.exports = sequelize.define('user', {
  id: {
    type: Sequelize.CHAR,
    primaryKey: true
  },
  name: Sequelize.CHAR
}, {
  timestamps: true,
  underscored: true
});

Vehicle.belongsToMany(User, { through: 'user_vehicles' });
User.belongsToMany(Vehicle, { through: 'user_vehicles' });
