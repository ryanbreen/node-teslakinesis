require 'rgeo'

class LocationsController < ApplicationController
  before_action :set_vehicle, only: [:index, :show, :edit, :update, :destroy]
  before_action :set_location, only: [:show, :edit, :update, :destroy]

  after_action :update_close_trips, only: [:create, :destroy]

  after_action :update_trips_after_delete, only: :destroy
  after_action :update_trips_after_create, only: :create

  # GET /locations
  # GET /locations.json
  def index
    @locations = Location.all.paginate(:page => params[:page], :per_page => 10)
  end

  # GET /locations/1
  # GET /locations/1.json
  def show
    # Figure out if this location is near any trip start or end points
    geolocation = @location[:geolocation]

    @type = :show_only

    @as_origin_count = Trip.where(:vehicle_id => @location[:vehicle_id], :start_location_id => @location[:id]).
      where.not(end_location_id: nil).count
    @as_destination_count = Trip.where(:vehicle_id => @location[:vehicle_id], :end_location_id => @location[:id]).
      where.not(start_location_id: nil).count
  end

  # GET /locations/new
  def new
    factory = RGeo::Geographic.simple_mercator_factory(:has_z_coordinate => true)
    @vehicle = Vehicle.find(params[:vehicle_id])
    @location = Location.new
  
    @location.vehicle_id = params[:vehicle_id]
    @location.geolocation = factory.point(params[:lng], params[:lat], params[:z])
  end

  # GET /locations/1/edit
  def edit
  end

  # POST /locations
  # POST /locations.json
  def create
    @vehicle = Vehicle.find(params[:vehicle_id])
    @location = Location.new(location_params)

    respond_to do |format|
      if @location.save

        geolocation = @location[:geolocation]

        format.html { redirect_to vehicle_location_path(@vehicle, @location), notice: 'Location was successfully created.' }
        format.json { render :show, status: :created, location: @location }
      else
        format.html { render :new }
        format.json { render json: @location.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /locations/1
  # PATCH/PUT /locations/1.json
  def update

    @vehicle = Vehicle.find(@location.vehicle_id)
    respond_to do |format|
      if @location.update(location_params)
        format.html { redirect_to vehicle_location_path(@vehicle, @location), notice: 'Location was successfully updated.' }
        format.json { render :show, status: :ok, location: @location }
      else
        format.html { render :edit }
        format.json { render json: @location.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /locations/1
  # DELETE /locations/1.json
  def destroy
    @vehicle = Vehicle.find(@location.vehicle_id)
    @location.destroy

    respond_to do |format|
      format.html { redirect_to vehicle_locations_url(@vehicle), notice: 'Location was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  private

    def update_close_trips
      ActiveRecord::Base.connection.execute("update trips set start_location_id = start_location_search.location_id from " +
        "(select trips.id as trip_id, (select locations.id location_id from locations " +
        "order by st_distance(trips.start_location, locations.geolocation) limit 1) from trips) as start_location_search " +
        "where trips.id = start_location_search.trip_id")
      ActiveRecord::Base.connection.execute("update trips set end_location_id = end_location_search.location_id from " +
        "(select trips.id as trip_id, (select locations.id location_id from locations " +
        "order by st_distance(trips.end_location, locations.geolocation) limit 1) from trips) as end_location_search " +
        "where trips.id = end_location_search.trip_id")
      # TODO: Force reload of origin and destination associations?
    end

    def update_trips_after_create
      # Retrieve all trips that match the new location
      matched_trips = Trip.where("start_location_id = #{@location.id} or end_location_id = #{@location.id}")

      matched_trips.each do |trip|
        # Delete trip detail
        trip.trip_detail.destroy
      end
    end

    def update_trips_after_delete
      # Retrieve all trips that match the old location
      matched_trips = Trip.where("start_location_id = #{@location.id} or end_location_id = #{@location.id}")

      matched_trips.each do |trip|

        # Delete any trip place badges
        Badge.where(
          :trip_id => trip.id,
          :badge_type_id => [10, 11, 12, 13]
        ).delete_all

        # Delete trip detail
        trip.trip_detail.destroy

        puts "Updating trip #{trip.to_yaml}"

        # Update the record
        trip.start_location_id = nil if trip.start_location_id == @location.id
        trip.end_location_id = nil if trip.end_location_id == @location.id
        trip.save
      end
    end

    def set_vehicle
      @vehicle = Vehicle.find(params[:vehicle_id])
    end

    # Use callbacks to share common setup or constraints between actions.
    def set_location
      @location = Location.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def location_params
      params.require(:location).permit(:geolocation, :vehicle_id, :name)
    end
end
