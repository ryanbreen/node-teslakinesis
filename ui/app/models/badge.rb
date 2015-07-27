class Badge < ActiveRecord::Base
  has_one :vehicle_telemetry_metric
  has_one :badge_type, :foreign_key => "id"
end
