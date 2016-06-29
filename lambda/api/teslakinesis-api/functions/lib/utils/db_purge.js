// Make sure all models are defined in sequelize
var models = require('../models/');

var sequelize = require('../creds/db.js').sequelize;

models.forEach(function(model) {
  model.destroy({ where: {} });
});
