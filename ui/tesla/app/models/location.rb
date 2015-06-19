class Location < ActiveRecord::Base

  belongs_to :vehicle

  validates :name, uniqueness: { scope: :vehicle_id,
    message: "should have a unique name" }

end
