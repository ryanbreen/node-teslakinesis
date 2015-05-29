require 'rgeo'

class VehicleTelemetryMetric < ActiveRecord::Base

  #RGeo::ActiveRecord::SpatialFactoryStore.instance.tap do |config|
    # Use a geographic implementation for point columns.
  #  puts "Dancing the charleston"
  #  config.register(RGeo::Geographic.spherical_factory(srid: 4326), geo_type: "point")
  #end

  scope :close_to, -> (lat, lng, distance_in_meters = 20000) {
    where(%{
      ST_DWithin(
        vehicle_telemetry_metrics.location,
        ST_GeographyFromText('SRID=4326;POINT(%f %f)'),
        %d
      )
    } % [lng, lat, distance_in_meters])
  }

=begin
  scope :close_to, -> (lat, lng, distance_in_meters = 2000) {
    where(%{
      ST_DWithin(
        ST_GeographyFromText(
          'SRID=4326;POINT(' || vehicle_telemetry_metrics.location.longitude || ' ' || vehicle_telemetry_metrics.location.latitude || ')'
        ),
        ST_GeographyFromText('SRID=4326;POINT(%f %f)'),
        %d
      )
    } % [lng, lat, distance_in_meters])
  }
=end

end
