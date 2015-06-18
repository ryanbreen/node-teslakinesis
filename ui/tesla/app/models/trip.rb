class Trip < ActiveRecord::Base

  belongs_to :vehicle
  has_many :vehicle_telemetry_metrics
  has_one :origin, :class_name => "Location", :foreign_key => "start_location_id"
  has_one :destination, :class_name => "Location", :foreign_key => "end_location_id"

end
