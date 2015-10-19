class SpeedDemonBadgeType < BadgeType

  def to_description(badge)
    "You hit #{badge.data}MPH, you maniac."
  end

end
