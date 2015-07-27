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
  BadgeType.create(
    id: 1,
    name: "speed-demon",
    description: "You drove more than 90mph on this trip.  Slow the fuck down!",
    icon: 'rocket',
    flavor: 'danger'
  )

  BadgeType.create(
    id: 2,
    name: "awesome-power",
    description: "You floored it.  Stop racing.",
    icon: 'tachometer',
    flavor: 'danger'
  )

  BadgeType.create(
    id: 3,
    name: "go-west-young-man",
    description: "This is the farthest west you've been.",
    icon: 'arrow-left',
    flavor: 'success'
  )

  BadgeType.create(
    id: 4,
    name: "to-the-sea",
    description: "Stop before you hit the water.",
    icon: 'arrow-right',
    flavor: 'success'
  )

  BadgeType.create(
    id: 5,
    name: "the-great-white-north",
    description: "You going to Canada?",
    icon: 'arrow-up',
    flavor: 'success'
  )

  BadgeType.create(
    id: 6,
    name: "southern-living",
    description: "The south is full of bugs.",
    icon: 'arrow-down',
    flavor: 'success'
  )

  BadgeType.create(
    id: 7,
    name: "top-speed",
    description: "This is the fastest you've gone on record.  Are you proud?",
    icon: 'trophy',
    flavor: 'danger'
  )

  BadgeType.create(
    id: 8,
    name: "coming-down-the-mountain",
    description: "You picked up a lot of energy regen.  Great work!",
    icon: 'power-off',
    flavor: 'success'
  )

  BadgeType.create(
    id: 9,
    name: "range-surfer",
    description: "Less than 20% charge.  Range anxiety?",
    icon: 'exclamation-triangle',
    flavor: 'warning'
  )
end

## Badge Ideas
# Fastest 1-3 on any given route
# High energy regen
# Soc below 20%
# Longest distance traveled
# Traveled over N miles with energy consumption below Y%