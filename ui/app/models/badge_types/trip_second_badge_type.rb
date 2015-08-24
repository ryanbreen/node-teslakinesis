class TripSecondBadgeType < BadgeType

  def to_description(badge)
    "The total duration of the trip was #{distance_of_time_in_words badge.data.to_i}."
  end

end
