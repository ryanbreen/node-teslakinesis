# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rake db:seed (or created alongside the db with db:setup).
#
# Examples:
#
#   cities = City.create([{ name: 'Chicago' }, { name: 'Copenhagen' }])
#   Mayor.create(name: 'Emanuel', city: cities.first)

1000.downto(1) do |i|

  VehicleTelemetryMetric.create(
    timestamp:      i,
    vehicle_id:     "100" + i.to_s,
    location:       RGeo::Geographic.spherical_factory(srid: 4326).point(-77.000000, 40.000000)
  )
  
end


VehicleTelemetryMetric.create(
  timestamp:      0,
  vehicle_id:     "1001", 
  location:       RGeo::Geographic.spherical_factory(srid: 4326).point(-75.990000, 39.010000)
)