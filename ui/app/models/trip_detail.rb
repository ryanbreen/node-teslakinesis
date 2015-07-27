class TripDetail < ActiveRecord::Base
  has_many :badges, :dependent => :delete_all
  belongs_to :trip
end
