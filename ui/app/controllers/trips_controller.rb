class TripsController < ApplicationController

  before_action :set_models, only: [:index, :show, :destroy, :calculate_badges]

  @@color_scale = [
    "#000000",
    "#00cc66",
    "#ff3300"
  ]

  def index
    @trips = Trip.where(:vehicle_id => params[:vehicle_id]).order("start_time desc").paginate(:page => params[:page])

    respond_to do |format|
      format.html
      format.json { render json: @trips }
    end
  end

  def from
    @from = Location.where(:vehicle_id => params[:vehicle_id], :name => params[:from]).first
    @endpoints = Trip.select('*').joins(:destination).
      where(:vehicle_id => params[:vehicle_id], :start_location_id => @from.id).
      where.not(end_location_id: nil).
      group("locations.name").count.sort_by {|_key, value| value}.reverse
  end

  def to
    @to = Location.where(:vehicle_id => params[:vehicle_id], :name => params[:to]).first
    @endpoints = Trip.select('*').joins(:origin).
      where(:vehicle_id => params[:vehicle_id], :end_location_id => @to.id).
      where.not(start_location_id: nil).
      group("locations.name").count.sort_by {|_key, value| value}.reverse
  end

  def between
    @from = Location.where(:vehicle_id => params[:vehicle_id], :name => params[:from]).first
    @to = Location.where(:vehicle_id => params[:vehicle_id], :name => params[:to]).first
    @trips = Trip.where(:vehicle_id => params[:vehicle_id], :start_location_id => @from.id, :end_location_id => @to.id).
      order("EXTRACT(EPOCH FROM (end_time - start_time))").paginate(:page => params[:page], :per_page => 5)
    @map_type = :overview
    collect_trip_data
  end

  def show
    @map_type = :detailed

    collect_trip_data
  end

  def destroy
    @trip.destroy
    respond_to do |format|
      format.html { redirect_to vehicle_trips_url(@vehicle), notice: 'Trip was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  def calculate_badges

  end

  # TODO: Hack needed to make merit happy.  Fix this.  It shouldn't be necessary.
  def current_trip
    @trip
  end

  private

    def collect_trip_data

      @trips = [ @trip ] if @trips == nil

      lowest_lng, highest_lng, lowest_lat, highest_lat = nil

      @trip_detail = []

      @trips.each_with_index do |trip, index|

        trip_detail = {}
        @trip_detail[index] = trip_detail

        where_condition = @map_type == :detailed ?
          "trip_id = ?" :
          "trip_id = ? and (id % 16 = 0)"

        trip_detail['vehicle_telemetry_metrics'] =
          VehicleTelemetryMetric.where(where_condition, trip[:id]).order("timestamp desc")

        trip_detail['hashes'] = []
        current_hash_speed = nil

        hash_index = -1

        Gmaps4rails.build_markers(trip_detail['vehicle_telemetry_metrics']) do |vehicle|
          lowest_lat = vehicle.location.latitude if lowest_lat == nil || vehicle.location.latitude < lowest_lat
          lowest_lng = vehicle.location.longitude if lowest_lng == nil || vehicle.location.longitude < lowest_lng
          highest_lat = vehicle.location.latitude if highest_lat == nil || vehicle.location.latitude > highest_lat
          highest_lng = vehicle.location.longitude if highest_lng == nil || vehicle.location.longitude > highest_lng

          if @map_type == :detailed
            case vehicle.speed
            when 0..25
              speed = 0
            when 26..50
              speed = 1
            else
              speed = 2
            end
          else
            speed = 0
          end

          # Create a new hash at this speed
          if current_hash_speed != speed
            hash_index += 1
            current_hash_speed = speed
            trip_detail['hashes'][hash_index] = {}
            trip_detail['hashes'][hash_index]["data"] = []
            trip_detail['hashes'][hash_index]["strokeColor"] = @@color_scale[speed]
          end

          trip_detail['hashes'][hash_index]["data"].push(:lat => vehicle.location.latitude, :lng => vehicle.location.longitude)
        end

        trip_detail['vehicle_telemetry_metrics'] = trip_detail['vehicle_telemetry_metrics'].paginate(:page => params[:page])

        trip_detail['upper_left'] = { :lat => highest_lat, :lng => lowest_lng }
        trip_detail['lower_right'] = { :lat => lowest_lat, :lng => highest_lng }
      end
    end

    def set_models
      @trip = Trip.find(params[:id]) if params[:id] != nil
      @vehicle = Vehicle.find(params[:vehicle_id]) if params[:vehicle_id] != nil
      @vehicle = Vehicle.find(@trip[:vehicle_id]) if @trip != nil
    end

end
