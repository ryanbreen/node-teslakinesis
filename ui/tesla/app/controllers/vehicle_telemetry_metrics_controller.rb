class VehicleTelemetryMetricsController < ApplicationController

  def index
    @vehicle_telemetry_metrics = VehicleTelemetryMetric.where("vehicle_id = ?", params[:id])
  end


end