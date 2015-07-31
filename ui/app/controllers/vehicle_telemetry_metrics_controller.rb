class VehicleTelemetryMetricsController < ApplicationController

  def index
    @vehicle_telemetry_metrics = VehicleTelemetryMetric.where("trip_id = ?", params[:trip_id]).
      paginate(:page => params[:page], :per_page => 100)

    respond_to do |format|
      format.html
      format.json { render json: @vehicle_telemetry_metrics}
    end
  end


end