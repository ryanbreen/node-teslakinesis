
// Make sure all models are defined in sequelize
require('../models/');

var sequelize = require('../creds/db.js').sequelize;

var BadgeType = require('../models/badge_type.js');

BadgeType.destroy({
  where: {}
}).
then(function() {

  var badge_types = [
    [ 1, 'speed-demon', 'You drove more than 90mph on this trip.  Slow the fuck down!', 'rocket', 'danger', '2015-08-20 13:10:55.351012', '2015-08-20 13:10:55.351012' ],
    [ 2, 'awesome-power', 'You floored it.  Stop racing.', 'tachometer', 'danger', '2015-08-20 13:10:55.479029', '2015-08-20 13:10:55.479029' ],
    [ 3, 'go-west-young-man', 'This is the farthest west you\'ve been.', 'arrow-left', 'success', '2015-08-20 13:10:55.551189', '2015-08-20 13:10:55.551189' ],
    [ 4, 'to-the-sea', 'Stop before you hit the water.', 'arrow-right', 'success', '2015-08-20 13:10:55.623841', '2015-08-20 13:10:55.623841' ],
    [ 5, 'the-great-white-north', 'You going to Canada?', 'arrow-up', 'success', '2015-08-20 13:10:55.695604', '2015-08-20 13:10:55.695604' ],
    [ 6, 'southern-living', 'The south is full of bugs.', 'arrow-down', 'success', '2015-08-20 13:10:55.770979', '2015-08-20 13:10:55.770979' ],
    [ 7, 'top-speed', 'This is the fastest you\'ve gone on record.  Are you proud?', 'flag-checkered', 'danger', '2015-08-20 13:10:55.842145', '2015-08-20 13:10:55.842145' ],
    [ 8, 'coming-down-the-mountain', 'You picked up a lot of energy regen.  Great work!', 'power-off', 'success', '2015-08-20 13:10:55.913609', '2015-08-20 13:10:55.913609' ],
    [ 9, 'range-surfer', 'Less than 25% charge.  Range anxiety?', 'exclamation-triangle', 'warning', '2015-08-20 13:10:55.985485', '2015-08-20 13:10:55.985485' ],
    [ 10, 'trip-first', 'This is the fastest you\'ve ever completed this trip!', 'trophy', 'danger', '2015-08-20 13:10:56.060546', '2015-08-20 13:10:56.060546' ],
    [ 11, 'trip-second', 'This is the second fastest you\'ve ever completed this trip.  If you ain\'t first, you\'re last!', 'trophy', 'warning', '2015-08-20 13:10:56.132528', '2015-08-20 13:10:56.132528' ],
    [ 12, 'trip-third', 'This is the third fastest you\'ve ever completed this trip.  At least you placed!', 'trophy', 'success', '2015-08-20 13:10:56.202402', '2015-08-20 13:10:56.202402' ],
    [ 13, 'trip-slowest', 'This is the slowest you\'ve ever completed this trip.  Was Jenn driving?', 'trash', 'danger', '2015-08-20 13:10:56.270849', '2015-08-20 13:10:56.270849' ]
  ];

  for (var i=0 ; i<badge_types.length; ++i) {
    badge_types[i] = {
      id: badge_types[i][0],
      name: badge_types[i][1],
      description: badge_types[i][2],
      icon: badge_types[i][3],
      flavor: badge_types[i][4],
      created_at: badge_types[i][5],
      updated_at: badge_types[i][6]
    };
  }

  BadgeType.bulkCreate(badge_types).then(function(badge_types) {
    console.log('seeded badge_types %s', badge_types);
  });
});
