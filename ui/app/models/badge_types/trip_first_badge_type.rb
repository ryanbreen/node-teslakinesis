class TripFirstBadgeType < BadgeType

  def to_description(badge)
    "The total duration of the trip was #{badge.data}s."
  end

end
