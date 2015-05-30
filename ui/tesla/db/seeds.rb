
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