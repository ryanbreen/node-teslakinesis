class SpeedDemonBadgeType < BadgeType

  def to_description(badge)
    "hit #{badge.data}MPH"
  end

end
