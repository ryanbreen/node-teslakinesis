class ComingDownTheMountainBadgeType < BadgeType

  def to_description(badge)
    "energy consumption #{badge.data}"
  end

end
