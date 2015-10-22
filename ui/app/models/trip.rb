class Trip < ActiveRecord::Base
  belongs_to :vehicle
  has_many :vehicle_telemetry_metrics, -> { order 'timestamp desc' }, :dependent => :delete_all
  has_one :trip_detail, :dependent => :delete
  has_one :origin, :class_name => "Location", :primary_key => 'start_location_id', :foreign_key => 'id'
  has_one :destination, :class_name => "Location", :primary_key => 'end_location_id', :foreign_key => 'id'

  # For detailed routes, we want to use line segments of different colors to represent different speeds.
  # We use green for 0-25MPH, orange for 25-50MPH, and red for 50+.
  @@color_scale = [
    "#74AD6A",
    "#FFAA38",
    "#C44537"
  ]

end
