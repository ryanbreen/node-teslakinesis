class ComingDownTheMountainBadgeType < BadgeType

  def to_description(badge)
    "You reached a peak energy regen of #{badge.data}KW."
  end

end
