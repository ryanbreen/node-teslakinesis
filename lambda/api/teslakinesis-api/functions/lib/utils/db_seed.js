
// Make sure all models are defined in sequelize
require('../models/');

var sequelize = require('../creds/db.js').sequelize;

var BadgeType = require('../models/badge_type.js');

console.log("syncing");
sequelize.sync().then(function() {
  console.log("synced");
  BadgeType.destroy({
    where: {}
  }).
  then(function() {
    BadgeType.bulkCreate([{
      id: 1,
      name: 'speed-demon',
      description: 'You drove more than 90mph on this trip.  Slow the fuck down!',
      icon: 'rocket',
      flavor: 'danger',
      created_at: '2015-08-20 13:10:55.351012',
      updated_at: '2015-08-20 13:10:55.351012'
    },
    {
      id: 2,
      name: 'awesome-power',
      description: 'You floored it.  Stop racing.',
      icon: 'tachometer',
      flavor: 'danger',
      created_at: '2015-08-20 13:10:55.479029',
      updated_at: '2015-08-20 13:10:55.479029'
    },
    {
      id: 3,
      name: 'go-west-young-man',
      description: 'This is the farthest west you\'ve been.',
      icon: 'arrow-left',
      flavor: 'success',
      created_at: '2015-08-20 13:10:55.551189',
      updated_at: '2015-08-20 13:10:55.551189'
    },
    {
      id: 4,
      name: 'to-the-sea',
      description: 'Stop before you hit the water.',
      icon: 'arrow-right',
      flavor: 'success',
      created_at: '2015-08-20 13:10:55.551189',
      updated_at: '2015-08-20 13:10:55.551189'
    },
    {
      id: 5,
      name: 'the-great-white-north',
      description: 'You going to Canada?',
      icon: 'arrow-up',
      flavor: 'success',
      created_at: '2015-08-20 13:10:55.695604',
      updated_at: '2015-08-20 13:10:55.695604'
    },
    {
      id: 6,
      name: 'southern-living',
      description: 'The south is full of bugs.',
      icon: 'arrow-down',
      flavor: 'success',
      created_at: '2015-08-20 13:10:55.770979',
      updated_at: '2015-08-20 13:10:55.770979'
    },
    {
      id: 7,
      name: 'top-speed',
      description: 'This is the fastest you\'ve gone on record.  Are you proud?',
      icon: 'flag-checkered',
      flavor: 'danger',
      created_at: '2015-08-20 13:10:55.842145',
      updated_at: '2015-08-20 13:10:55.842145'
    },
    {
      id: 8,
      name: 'coming-down-the-mountain',
      description: 'You picked up a lot of energy regen.  Great work!',
      icon: 'power-off',
      flavor: 'success',
      created_at: '2015-08-20 13:10:55.913609',
      updated_at: '2015-08-20 13:10:55.913609'
    },
    {
      id: 9,
      name: 'range-surfer',
      description: 'Less than 25% charge.  Range anxiety?',
      icon: 'exclamation-triangle',
      flavor: 'warning',
      created_at: '2015-08-20 13:10:55.985485',
      updated_at: '2015-08-20 13:10:55.985485'
    },
    {
      id: 10,
      name: 'trip-first',
      description: 'This is the fastest you\'ve ever completed this trip!',
      icon: 'trophy',
      flavor: 'danger',
      created_at: '2015-08-20 13:10:56.060546',
      updated_at: '2015-08-20 13:10:56.060546'
    },
    {
      id: 11,
      name: 'trip-second',
      description: 'This is the second fastest you\'ve ever completed this trip.  If you ain\'t first, you\'re last!',
      icon: 'trophy',
      flavor: 'warning',
      created_at: '2015-08-20 13:10:56.132528',
      updated_at: '2015-08-20 13:10:56.132528'
    },
    {
      id: 12,
      name: 'trip-third',
      description: 'This is the third fastest you\'ve ever completed this trip.  At least you placed!',
      name: 'trophy',
      flavor: 'success',
      created_at: '2015-08-20 13:10:56.202402',
      updated_at: '2015-08-20 13:10:56.202402'
    },
    {
      id: 13,
      name: 'trip-slowest',
      description: 'This is the slowest you\'ve ever completed this trip.  Was Jenn driving?',
      icon: 'trash',
      flavor: 'danger',
      created_at: '2015-08-20 13:10:56.270849',
      updated_at: '2015-08-20 13:10:56.270849'
    }]).then(function(badge_types) {
      console.log('seeded badge_types %s', badge_types);
    });
  });
});
