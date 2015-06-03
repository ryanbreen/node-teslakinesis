class VehicleTelemetryMetricsController < ApplicationController

  def index
    @vehicle_telemetry_metrics = VehicleTelemetryMetric.where("vehicle_id = ?", params[:id])
    
    @hash = Gmaps4rails.build_markers(@vehicle_telemetry_metrics) do |vehicle, marker|
      marker.lat vehicle.location.latitude
      marker.lng vehicle.location.longitude
    end
  end


end