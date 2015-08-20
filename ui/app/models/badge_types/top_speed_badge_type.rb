class TopSpeedBadgeType < BadgeType

  def to_description(badge)
    "hit #{badge.data}"
  end

end
