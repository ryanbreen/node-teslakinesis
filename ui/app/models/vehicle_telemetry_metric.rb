class VehicleTelemetryMetric < ActiveRecord::Base
  has_merit

  belongs_to :trip

  self.per_page = 100
end
