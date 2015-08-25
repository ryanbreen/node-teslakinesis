class Trip < ActiveRecord::Base
  belongs_to :vehicle
  has_many :vehicle_telemetry_metrics, -> { order 'timestamp desc' }, :dependent => :delete_all
  has_one :trip_detail, :dependent => :delete
  has_many :badges, through: :trip_detail 
  has_one :origin, :class_name => "Location", :primary_key => 'start_location_id', :foreign_key => 'id'
  has_one :destination, :class_name => "Location", :primary_key => 'end_location_id', :foreign_key => 'id'

  @@color_scale = [
    "#74AD6A",
    "#FFAA38",
    "#C44537"
  ]

  # We want to populate a trip_detail record if one doesn't exist, so we override
  # the default getter and add our logic.
  alias_method :original_trip_detail, :trip_detail
  def trip_detail

    return self.original_trip_detail if self.original_trip_detail != nil
    
    lowest_lng, highest_lng, lowest_lat, highest_lat = nil

    self.build_trip_detail if self.end_time == nil
    self.create_trip_detail unless self.end_time == nil
    self.original_trip_detail.vehicle_id = self.vehicle_id

    badge_engine = BadgeEngine.new(self.original_trip_detail)

    current_hash = []
    current_hash_speed = nil

    js_buffer = StringIO.new
    js_buffer << "var polylines = [];\n"
    js_buffer << "polylines.push([ ["

    detailed_js_buffer = StringIO.new
    detailed_js_buffer << "var polylines = [];\n"

    first_line = true

    badge_types = BadgeType.all
    badge_processors = []
    badge_types.each do |type|
      badge_processors << type.dup
    end

    self.vehicle_telemetry_metrics.each do |metric|

      if metric.id % 16 == 0
        js_buffer << ',' unless first_line
        js_buffer << {:lat => metric.location.latitude, :lng => metric.location.longitude}.to_json.html_safe
        first_line = false
      end

      # Process this vehicle metric for each badge type
      badge_processors.each do |badge_processor|
        badge_processor.process_metric self.original_trip_detail, metric
      end

      lowest_lat = metric.location.latitude if lowest_lat == nil || metric.location.latitude < lowest_lat
      lowest_lng = metric.location.longitude if lowest_lng == nil || metric.location.longitude < lowest_lng
      highest_lat = metric.location.latitude if highest_lat == nil || metric.location.latitude > highest_lat
      highest_lng = metric.location.longitude if highest_lng == nil || metric.location.longitude > highest_lng

      case metric.speed
      when 0..25
        speed = 0
      when 26..50
        speed = 1
      else
        speed = 2
      end

      # Create a new hash at this speed
      if current_hash_speed != speed
        if current_hash.length > 0
          detailed_js_buffer << "polylines.push([ "
          detailed_js_buffer << (current_hash.to_json.html_safe)
          detailed_js_buffer << ", \'"
          detailed_js_buffer << @@color_scale[current_hash_speed]
          detailed_js_buffer << "\']);\n"
        end
        current_hash_speed = speed
        current_hash = []
      end

      current_hash.push({:lat => metric.location.latitude, :lng => metric.location.longitude})
    end

    if self.end_time != nil
      badge_processors.each do |badge_processor|
        badge_processor.metrics_complete self.original_trip_detail
      end
    end

    js_buffer << "], \'"
    js_buffer << @@color_scale[0]
    js_buffer << "\']);\n"

    self.original_trip_detail.detailed_route = Base64.encode64(Zlib::Deflate.deflate(detailed_js_buffer.string.html_safe))
    self.original_trip_detail.summary_route = Base64.encode64(Zlib::Deflate.deflate(js_buffer.string.html_safe))

    self.original_trip_detail.upper_left = { :lat => highest_lat, :lng => lowest_lng }.to_json.html_safe
    self.original_trip_detail.lower_right = { :lat => lowest_lat, :lng => highest_lng }.to_json.html_safe

    # Do not save this trip_detail unless the trip is done.
    self.original_trip_detail.save unless self.end_time == nil

    self.original_trip_detail
  end

end
