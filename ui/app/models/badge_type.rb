class BadgeType < ActiveRecord::Base

  def to_description(badge)
    badge.data
  end

end
