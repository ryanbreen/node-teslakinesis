class TripDetail < ActiveRecord::Base
  has_many :badges, -> {order 'vehicle_telemetry_metric_id desc'}, :dependent => :delete_all
  belongs_to :trip
end
