class VehicleTelemetryMetric < ActiveRecord::Base
  belongs_to :trip

  self.per_page = 100
end
