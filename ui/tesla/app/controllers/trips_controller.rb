class TripsController < ApplicationController

  def index
    @trips = Trip.where("vehicle_id = ?", params[:vehicle_id])
  end

  def show
    @trip = Trip.find_by id: params[:id]

    @vehicle_telemetry_metrics =
      VehicleTelemetryMetric.where("vehicle_id = ? and timestamp >= ? and timestamp <= ?",
      @trip[:vehicle_id], @trip[:start_time], @trip[:end_time]).order("timestamp")

    lowest_lng, highest_lng, lowest_lat, highest_lat = nil

    @hash = Gmaps4rails.build_markers(@vehicle_telemetry_metrics) do |vehicle, marker|
      lowest_lat = vehicle.location.latitude if !lowest_lat || vehicle.location.latitude < lowest_lat
      lowest_lng = vehicle.location.longitude if !lowest_lng || vehicle.location.longitude < lowest_lng
      highest_lat = vehicle.location.latitude if !highest_lat || vehicle.location.latitude > highest_lat
      highest_lng = vehicle.location.longitude if !highest_lng || vehicle.location.longitude > highest_lat

      marker.lat vehicle.location.latitude
      marker.lng vehicle.location.longitude
    end

    @upper_left = { :lat => highest_lat, :lng => lowest_lng }
    @lower_right = { :lat => lowest_lat, :lng => highest_lng }

  end

end
