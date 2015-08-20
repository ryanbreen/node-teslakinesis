class SouthernLivingBadgeType < BadgeType

  def to_description(badge)
    "at latitude #{badge.data}"
  end

end
