class Badge < ActiveRecord::Base
  belongs_to :vehicle_telemetry_metric
  belongs_to :badge_type
  belongs_to :vehicle
end
