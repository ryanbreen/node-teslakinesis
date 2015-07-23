require 'action_view'
require 'action_view/helpers'
include ActionView::Helpers::DateHelper

class TripsController < ApplicationController

  before_action :set_models, only: [:index, :show, :destroy, :calculate_badges]

  @@color_scale = [
    "#74AD6A",
    "#FFAA38",
    "#C44537"
  ]

  def index
    @trips = Trip.includes(:vehicle_telemetry_metrics).
      where(:vehicle_id => params[:vehicle_id]).order("start_time desc").paginate(:page => params[:page], :per_page => 5)
    collect_trip_data

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
      order("EXTRACT(EPOCH FROM (end_time - start_time))").paginate(:page => params[:page], :per_page => 10)
    @map_type = :overview
    collect_trip_data
  end

  def show
    @map_type = :detailed
    @from_short = @trip.origin != nil ? @trip.origin.name : "unknown origin"
    @from = @trip.origin != nil ? @trip.origin.name : "unknown origin (" + 
      view_context.link_to('Name it!', new_vehicle_location_path(:vehicle_id => params[:vehicle_id], 
        :lng => @trip[:start_location].longitude, :lat => @trip[:start_location].latitude, 
        :z => @trip[:start_location].z)) + ")"
    @from_linked = @trip.origin != nil ? 
      view_context.link_to(@trip.origin.name, vehicle_location_path(@trip.vehicle_id, @trip.origin)) :
      "unknown origin (" + view_context.link_to('Name it!', new_vehicle_location_path(:vehicle_id => params[:vehicle_id], 
        :lng => @trip[:start_location].longitude, :lat => @trip[:start_location].latitude, 
        :z => @trip[:start_location].z)) + ")"
    @to_short = @trip.destination != nil ? @trip.destination.name : "unknown destination"
    @to = @trip.destination != nil ? @trip.destination.name : "unknown destination (" + 
      view_context.link_to('Name it!', new_vehicle_location_path(:vehicle_id => params[:vehicle_id], 
        :lng => @trip[:end_location].longitude, :lat => @trip[:end_location].latitude, 
        :z => @trip[:end_location].z)) + ")" unless @trip[:end_location] == nil
    @to_linked = @trip.destination != nil ?
      view_context.link_to(@trip.destination.name, vehicle_location_path(@trip.vehicle_id, @trip.destination)) :
      "unknown destination (" + 
      view_context.link_to('Name it!', new_vehicle_location_path(:vehicle_id => params[:vehicle_id], 
        :lng => @trip[:end_location].longitude, :lat => @trip[:end_location].latitude, 
        :z => @trip[:end_location].z)) + ")" unless @trip[:end_location] == nil
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

      now = Time.zone.now.in_time_zone('America/New_York')
      current_date = now.to_date

      @trips = [ @trip ] if @trips == nil

      @trip_detail = []

      @trips.each_with_index do |trip, index|

        lowest_lng, highest_lng, lowest_lat, highest_lat = nil

        trip_date = trip.start_time.in_time_zone('America/New_York').to_date

        trip_detail = {}
        @trip_detail[index] = trip_detail

        trip_detail['pretty_start_date'] = (current_date == trip_date) ? "Today" : 
          (current_date.yesterday == trip_date) ? "Yesterday" :
            trip.start_time.in_time_zone('America/New_York').to_formatted_s(:date_us)

        if trip.end_time != nil
          trip_detail['pretty_duration'] = distance_of_time_in_words(trip.start_time, trip.end_time, include_seconds: true)
          trip_detail['pretty_precise_duration'] = precise_distance_of_time_in_words(trip.start_time, trip.end_time)
        else
          trip_detail['pretty_duration'] = distance_of_time_in_words(trip.start_time, DateTime.now, include_seconds: true)
          trip_detail['pretty_precise_duration'] = precise_distance_of_time_in_words(trip.start_time, Time.now)
        end               

        detailed_map = @map_type == :detailed

        current_hash = []
        current_hash_speed = nil

        js_buffer = StringIO.new
        js_buffer = "var polylines = [];\n"

        Gmaps4rails.build_markers(trip.vehicle_telemetry_metrics) do |vehicle|

          next unless detailed_map || (vehicle.id % 16 == 0)

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
            current_hash_speed = speed
            if current_hash.length > 0
              js_buffer << "polylines.push([ "
              js_buffer << (current_hash.to_json.html_safe)
              js_buffer << ", \'"
              js_buffer << @@color_scale[speed]
              js_buffer << " \']);\n"
            end
            current_hash = []
          end

          current_hash.push(:lat => vehicle.location.latitude, :lng => vehicle.location.longitude)
        end

        if trip.trip_detail == nil
          trip.create_trip_detail
          trip.trip_detail.vehicle_id = params[:vehicle_id]
        end

        trip.trip_detail.detailed_route = js_buffer.to_s.html_safe

        trip.trip_detail.upper_left = { :lat => highest_lat, :lng => lowest_lng }.to_json.html_safe
        trip.trip_detail.lower_right = { :lat => lowest_lat, :lng => highest_lng }.to_json.html_safe

        trip.trip_detail.save
      end
    end

    def set_models
      @trip = Trip.includes(:vehicle_telemetry_metrics).includes(:trip_detail).find(params[:id]) if params[:id] != nil
      @vehicle = Vehicle.find(params[:vehicle_id]) if params[:vehicle_id] != nil
      @vehicle = Vehicle.find(@trip[:vehicle_id]) if @trip != nil
    end

end
