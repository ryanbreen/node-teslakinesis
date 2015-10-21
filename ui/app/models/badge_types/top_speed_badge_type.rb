class TopSpeedBadgeType < BadgeType

  def to_description(badge)
    "You hit #{badge.data}MPH, you asshole.  You're a father now."
  end

end
