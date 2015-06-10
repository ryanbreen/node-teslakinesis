class Trip < ActiveRecord::Base

  belongs_to :vehicle
  has_many :vehicle_telemetry_metrics

end
