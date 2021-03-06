=begin
connection = ActiveRecord::Base.connection()
connection.execute("insert into vehicle_telemetry_metrics (timestamp, vehicle_id, location, created_at, updated_at) (
select now() as timestamp, i as vehicle_id, ST_GeographyFromText('SRID=4326;POINT(' || 39 + x.lon || ' ' || x.lat || ')'), now(), now()
  from (
    select i, random() * 10 as lat, random() * 10 as lon
    from generate_series(1,100000) as i
  )
as x);")

VehicleTelemetryMetric.create(
  timestamp:      0,
  vehicle_id:     "1001", 
  location:       RGeo::Geographic.spherical_factory(srid: 4326).point(-75.990000, 39.010000)
)
=end

if Vehicle.count == 0
  Vehicle.create(
    vehicle_id: "6856198612260671482",
    name: "KITT"
  )
end

if BadgeType.count == 0
  SpeedDemonBadgeType.create(
    id: 1,
    name: "speed-demon",
    description: "You drove more than 90mph on this trip.  Slow the fuck down!",
    icon: 'rocket',
    flavor: 'danger'
  )

  AwesomePowerBadgeType.create(
    id: 2,
    name: "awesome-power",
    description: "You floored it.  Stop racing.",
    icon: 'tachometer',
    flavor: 'danger'
  )

  GoWestYoungManBadgeType.create(
    id: 3,
    name: "go-west-young-man",
    description: "This is the farthest west you've been.",
    icon: 'arrow-left',
    flavor: 'success'
  )

  ToTheSeaBadgeType.create(
    id: 4,
    name: "to-the-sea",
    description: "Stop before you hit the water.",
    icon: 'arrow-right',
    flavor: 'success'
  )

  TheGreatWhiteNorthBadgeType.create(
    id: 5,
    name: "the-great-white-north",
    description: "You going to Canada?",
    icon: 'arrow-up',
    flavor: 'success'
  )

  SouthernLivingBadgeType.create(
    id: 6,
    name: "southern-living",
    description: "The south is full of bugs.",
    icon: 'arrow-down',
    flavor: 'success'
  )

  TopSpeedBadgeType.create(
    id: 7,
    name: "top-speed",
    description: "This is the fastest you've gone on record.  Are you proud?",
    icon: 'flag-checkered',
    flavor: 'danger'
  )

  ComingDownTheMountainBadgeType.create(
    id: 8,
    name: "coming-down-the-mountain",
    description: "You picked up a lot of energy regen.  Great work!",
    icon: 'power-off',
    flavor: 'success'
  )

  RangeSurferBadgeType.create(
    id: 9,
    name: "range-surfer",
    description: "Less than 25% charge.  Range anxiety?",
    icon: 'exclamation-triangle',
    flavor: 'warning'
  )

  TripFirstBadgeType.create(
    id: 10,
    name: "trip-first",
    description: "This is the fastest you've ever completed this trip!",
    icon: 'trophy',
    flavor: 'danger'
  )

  TripSecondBadgeType.create(
    id: 11,
    name: "trip-second",
    description: "This is the second fastest you've ever completed this trip.  If you ain't first, you're last!",
    icon: 'trophy',
    flavor: 'warning'
  )

  TripThirdBadgeType.create(
    id: 12,
    name: "trip-third",
    description: "This is the third fastest you've ever completed this trip.  At least you placed!",
    icon: 'trophy',
    flavor: 'success'
  )

  TripLastBadgeType.create(
    id: 13,
    name: "trip-slowest",
    description: "This is the slowest you've ever completed this trip.  Was Jenn driving?",
    icon: 'trash',
    flavor: 'danger'
  )
end

## Badge Ideas
# Fastest 1-3 on any given route
# Longest distance traveled
# Traveled over N miles with energy consumption below Y%