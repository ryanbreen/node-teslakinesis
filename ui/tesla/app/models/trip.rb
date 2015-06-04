class Trip < ActiveRecord::Base

  has_many :vehicle_telemetry_metrics

end
