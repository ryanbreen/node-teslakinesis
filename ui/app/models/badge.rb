class Badge < ActiveRecord::Base
  has_one :vehicle_telemetry_metric
end
