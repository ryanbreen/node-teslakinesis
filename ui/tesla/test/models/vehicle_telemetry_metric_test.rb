require 'test_helper'

class VehicleTelemetryMetricTest < ActiveSupport::TestCase
  test "close metrics" do

    far_point = VehicleTelemetryMetric.create!(
      timestamp:      1,
      vehicle_id:     "1001", 
      location:       factory.point(-77.000000, 40.000000)
    )
    close_point = VehicleTelemetryMetric.create!(
      timestamp:      2,
      vehicle_id:     "1001", 
      location:       factory.point(-75.990000, 39.010000)
    )

    #all_vehicles = VehicleTelemetryMetric.all
    #all_vehicles.each do |key|
    #  puts key
    #end

#    puts "String format: #{RGeo::WKRep::WKBGenerator.new(hex_format: true, type_format: :ewkb, emit_ewkb_srid: true).generate(RGeo::Geographic.spherical_factory(srid: 4326).point(-77.000000, 40.000000))}"

    assert_equal 2,           VehicleTelemetryMetric.all.size

    # This returns a value from the DB but not from here.  Why?
    close_points = VehicleTelemetryMetric.close_to(-76.000000, 39.000000).load

    puts close_points

    assert_equal 1,           close_points.size
    assert_equal close_point, close_points.first
  end
end
