class TheGreatWhiteNorthBadgeType < BadgeType

  def to_description(badge)
    "at latitude #{badge.data}"
  end

end
