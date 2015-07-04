class Trip < ActiveRecord::Base
  has_merit

  belongs_to :vehicle
  has_many :vehicle_telemetry_metrics, dependent: :destroy
  has_one :origin, :class_name => "Location", :primary_key => 'start_location_id', :foreign_key => 'id'
  has_one :destination, :class_name => "Location", :primary_key => 'end_location_id', :foreign_key => 'id'

end
