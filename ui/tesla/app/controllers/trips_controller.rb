class TripsController < ApplicationController

  before_action :set_models, only: [:index, :show]

  @@color_scale = [
    "#000000",
    "#00cc66",
    "#ff3300"
  ]

  def index
    @trips = Trip.where("vehicle_id = ?", params[:vehicle_id]).order("start_time")
  end

  def from
    @from = Location.where(:vehicle_id => params[:vehicle_id], :name => params[:from]).first
    @trips = Trip.where(:vehicle_id => params[:vehicle_id], :start_location_id => @from.id).
      order("start_time")
  end

  def between
    @from = Location.where("vehicle_id = ? and name = ?", params[:vehicle_id], params[:from]).first
    @to = Location.where("vehicle_id = ? and name = ?", params[:vehicle_id], params[:to]).first
    @trips = Trip.where("vehicle_id = ? and start_location_id = ? and end_location_id = ?", params[:vehicle_id], @from.id, @to.id).
      order("EXTRACT(EPOCH FROM (end_time - start_time))")
  end

  def show
    @vehicle_telemetry_metrics =
      VehicleTelemetryMetric.where("vehicle_id = ? and timestamp >= ? and timestamp <= ?",
      @trip[:vehicle_id], @trip[:start_time], @trip[:end_time]).order("timestamp")

    lowest_lng, highest_lng, lowest_lat, highest_lat = nil

    @hashes = []
    current_hash_speed = nil

    index = -1

    Gmaps4rails.build_markers(@vehicle_telemetry_metrics) do |vehicle, marker|
      lowest_lat = vehicle.location.latitude if lowest_lat == nil || vehicle.location.latitude < lowest_lat
      lowest_lng = vehicle.location.longitude if lowest_lng == nil || vehicle.location.longitude < lowest_lng
      highest_lat = vehicle.location.latitude if highest_lat == nil || vehicle.location.latitude > highest_lat
      highest_lng = vehicle.location.longitude if highest_lng == nil || vehicle.location.longitude > highest_lng

      case vehicle.speed
      when 0..25
        speed = 0
      when 26..50
        speed = 1
      else
        speed = 2
      end

      # Create a new hash at this speed
      if current_hash_speed != speed
        index += 1
        current_hash_speed = speed
        @hashes[index] = {}
        @hashes[index]["data"] = []
        @hashes[index]["strokeColor"] = @@color_scale[speed]
      end

      @hashes[index]["data"].push(:lat => vehicle.location.latitude, :lng => vehicle.location.longitude)
    end

    @upper_left = { :lat => highest_lat, :lng => lowest_lng }
    @lower_right = { :lat => lowest_lat, :lng => highest_lng }

    puts @upper_left
    puts @lower_right

    @vehicle_telemetry_metrics = @vehicle_telemetry_metrics.paginate(:page => params[:page])

  end

  private
    def set_models
      @trip = Trip.find(params[:id]) if params[:id] != nil
      @vehicle = Vehicle.find(params[:vehicle_id]) if params[:vehicle_id] != nil
      @vehicle = Vehicle.find(@trip[:vehicle_id]) if @trip != nil
    end

end
