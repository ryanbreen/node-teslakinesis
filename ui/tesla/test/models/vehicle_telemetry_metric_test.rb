require 'test_helper'

class VehicleTelemetryMetricTest < ActiveSupport::TestCase
  test "close metrics" do

#    beans = VehicleTelemetryMetric.create(timestamp: 3, vehicle_id: "1001")

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

    close_points = VehicleTelemetryMetric.close_to(39.000000, -76.000000).load

    puts close_points

    assert_equal 1,           close_points.size
    assert_equal close_point, close_points.first
  end
end
