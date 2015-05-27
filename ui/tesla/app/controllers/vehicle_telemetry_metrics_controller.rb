class VehicleTelemetryMetricsController < ApplicationController

  def index
    @vehicle_telemetry_metrics = VehicleTelemetryMetric.all
  end

end