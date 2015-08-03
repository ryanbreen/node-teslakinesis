require 'action_view'
require 'action_view/helpers'
require 'base64'
require "zlib"
include ActionView::Helpers::DateHelper

class TripsController < ApplicationController

  helper FormattedTimeHelper

  before_action :set_models, only: [:index, :show, :destroy, :calculate_badges]

  def index
    @trips = Trip.includes(:trip_detail).includes(:origin).includes(:destination).
      where(:vehicle_id => params[:vehicle_id]).order("start_time desc").paginate(:page => params[:page], :per_page => 10)

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
  end

  def destroy
    @trip.destroy
    respond_to do |format|
      format.html { redirect_to vehicle_trips_url(@vehicle), notice: 'Trip was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  private

    def set_models
      @trip = Trip.includes(:trip_detail).find(params[:id]) if params[:id] != nil
      @vehicle = Vehicle.find(params[:vehicle_id]) if params[:vehicle_id] != nil
      @vehicle = Vehicle.find(@trip[:vehicle_id]) if @trip != nil
    end

end
