class SouthernLivingBadgeType < BadgeType

  def to_description(badge)
    "You traveled all the way to latitude #{badge.data}."
  end

end
