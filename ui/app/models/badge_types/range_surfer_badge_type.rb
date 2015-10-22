class RangeSurferBadgeType < BadgeType

  def to_description(badge)
    "Energy remaining reached a low of #{badge.data}%."
  end

end
