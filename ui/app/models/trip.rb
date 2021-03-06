require 'net/http'

class Trip < ActiveRecord::Base
  belongs_to :vehicle
  has_many :vehicle_telemetry_metrics, -> { order 'timestamp desc' }, :dependent => :delete_all
  has_one :trip_detail, :dependent => :delete
  has_one :origin, :class_name => "Location", :primary_key => 'start_location_id', :foreign_key => 'id'
  has_one :destination, :class_name => "Location", :primary_key => 'end_location_id', :foreign_key => 'id'

  # We want to populate a trip_detail record if one doesn't exist, so we override the default getter and
  # add our logic.
  alias_method :original_trip_detail, :trip_detail
  def trip_detail
    # If the active record trip_detail method returns a result, that means we've already created and
    # cached this record.  If that's the case, return it.
    return self.original_trip_detail if self.original_trip_detail != nil

    # Otherwise, call the trip_detail API
    uri = URI("https://api.ryanbreen.com/v1/trip_detail")
    req = Net::HTTP::Post.new(uri)
    req.body = "{\"trip_id\": \"#{id}\"}"
    puts req.body
    req.content_type = 'application/json'
    res = Net::HTTP.start(uri.hostname, uri.port, :use_ssl => true) {|http|
      http.request(req)
    }
    puts res.body
    rvalue = self.original_trip_detail(true)

    if self.end_time == nil
      # Delete trip_detail from DB if it was from a trip in progress.
      self.original_trip_detail.destroy
    end

    rvalue
  end

end
