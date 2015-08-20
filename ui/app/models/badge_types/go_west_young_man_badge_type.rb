class GoWestYoungManBadgeType < BadgeType

  def to_description(badge)
    "at longitude #{badge.data}"
  end

end
