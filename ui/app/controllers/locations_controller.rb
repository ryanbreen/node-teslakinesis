require 'rgeo'

class LocationsController < ApplicationController
  before_action :set_vehicle, only: [:index, :show, :edit, :update, :destroy]
  before_action :set_location, only: [:show, :edit, :update, :destroy]

  after_action :update_close_trips, only: [:create, :destroy]

  # GET /locations
  # GET /locations.json
  def index
    @locations = Location.all.paginate(:page => params[:page], :per_page => 10)
  end

  # GET /locations/1
  # GET /locations/1.json
  def show
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

      # cache current start and end locations for trips.  we only want to rebuild trip_detail if there was an actual
      # change, so we diff the updates against the current_trips cache to see which trips actually changed
      current_trips = ActiveRecord::Base.connection.execute("select id, start_location_id, end_location_id from trips")

      # Always purge all location mappings.  This is to make sure that previous errors in location matching logic
      # are correctable.
      ActiveRecord::Base.connection.execute("update trips set start_location_id = NULL, end_location_id = NULL " +
        "where vehicle_id = '#{params[:vehicle_id]}'")

      [*ActiveRecord::Base.connection.execute("update trips set start_location_id = start_location_search.location_id from " +
        "(select trips.id as trip_id, (select locations.id location_id from locations " +
        "where ST_DWITHIN(trips.start_location, locations.geolocation, 200) " +
        "order by st_distance(trips.start_location, locations.geolocation) limit 1) from trips) as start_location_search " +
        "where trips.id = start_location_search.trip_id returning id, start_location_id")].map do |changed_trip|
        if current_trips[changed_trip['id']]['start_location_id'] != changed_trip['start_location_id']
          puts "Trip #{trip['id']} start location changed from #{current_trips[changed_trip['id']]['start_location_id']}\
            #{changed_trip['start_location_id']} to "
          Trip.find(trip['id']).trip_detail.destroy
        end
      end

      [*ActiveRecord::Base.connection.execute("update trips set end_location_id = end_location_search.location_id from " +
        "(select trips.id as trip_id, (select locations.id location_id from locations " +
        "where ST_DWITHIN(trips.end_location, locations.geolocation, 200) " +
        "order by st_distance(trips.end_location, locations.geolocation) limit 1) from trips) as end_location_search " +
        "where trips.id = end_location_search.trip_id returning id")].map do |trip|
        puts "Purging trip #{trip['id']}"
        Trip.find(trip['id']).trip_detail.destroy
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
