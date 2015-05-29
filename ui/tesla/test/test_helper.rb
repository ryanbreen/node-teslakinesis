ENV['RAILS_ENV'] ||= 'test'
require File.expand_path('../../config/environment', __FILE__)
require 'rails/test_help'

class ActiveSupport::TestCase
  # Setup all fixtures in test/fixtures/*.yml for all tests in alphabetical order.
  fixtures :all

  def factory
    #RGeo::Cartesian.preferred_factory(srid: 3785)
    RGeo::Geographic.spherical_factory(srid: 4326)
  end
end
