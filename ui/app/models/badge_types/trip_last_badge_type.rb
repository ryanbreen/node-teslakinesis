class TripLastBadgeType < BadgeType

  def to_description(badge)
    "total duration #{badge.data}"
  end

end
