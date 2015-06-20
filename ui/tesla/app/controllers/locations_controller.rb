require 'rgeo'

class LocationsController < ApplicationController
  before_action :set_vehicle, only: [:index, :show, :edit, :update, :destroy]
  before_action :set_location, only: [:show, :edit, :update, :destroy]

  # GET /locations
  # GET /locations.json
  def index
    @locations = Location.all
  end

  # GET /locations/1
  # GET /locations/1.json
  def show
    # Figure out if this location is near any trip start or end points
    geolocation = @location[:geolocation]

    ActiveRecord::Base.connection.execute("update trips set start_location_id = #{@location.id} where vehicle_id = '#{@location.vehicle_id}' and ST_DWITHIN(trips.start_location, ST_GeographyFromText('SRID=4326;POINT(#{geolocation.longitude} #{geolocation.latitude} #{geolocation.z})'), 200)")
    ActiveRecord::Base.connection.execute("update trips set end_location_id = #{@location.id} where vehicle_id = '#{@location.vehicle_id}' and ST_DWITHIN(trips.end_location, ST_GeographyFromText('SRID=4326;POINT(#{geolocation.longitude} #{geolocation.latitude} #{geolocation.z})'), 200)")
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

        # Figure out if this location is near any trip start or end points
        ActiveRecord::Base.connection.execute("update trips set start_location_id = #{@location.id} where vehicle_id = '#{@location.vehicle_id}' and ST_DWITHIN(trips.start_location, ST_GeographyFromText('SRID=4326;POINT(#{geolocation.longitude} #{geolocation.latitude} #{geolocation.z})'), 200)")
        ActiveRecord::Base.connection.execute("update trips set end_location_id = #{@location.id} where vehicle_id = '#{@location.vehicle_id}' and ST_DWITHIN(trips.end_location, ST_GeographyFromText('SRID=4326;POINT(#{geolocation.longitude} #{geolocation.latitude} #{geolocation.z})'), 200)")

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

    def set_vehicle
      @vehicle = Vehicle.find(params[:vehicle_id])
    end

    # Use callbacks to share common setup or constraints between actions.
    def set_location
      puts params
      @location = Location.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def location_params
      params.require(:location).permit(:geolocation, :vehicle_id, :name)
    end
end
