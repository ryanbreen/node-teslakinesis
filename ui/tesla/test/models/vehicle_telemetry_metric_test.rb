require 'test_helper'

class VehicleTelemetryMetricTest < ActiveSupport::TestCase
  test "close metrics" do

    assert_equal 2,           VehicleTelemetryMetric.all.size

    # This returns a value from the DB but not from here.  Why?
    close_points = VehicleTelemetryMetric.close_to(-76.000000, 39.000000).load

    puts close_points

    assert_equal 1,           close_points.size
    assert_equal close_point, close_points.first
  end
end
