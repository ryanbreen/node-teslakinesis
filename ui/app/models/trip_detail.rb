class TripDetail < ActiveRecord::Base
  has_many :badges, :dependent => :delete_all
end
