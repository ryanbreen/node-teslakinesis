class Vehicle < ActiveRecord::Base

  self.primary_key = "vehicle_id"

  has_many :trips
  has_many :locations

end
