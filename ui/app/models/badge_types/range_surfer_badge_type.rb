class RangeSurferBadgeType < BadgeType

  def to_description(badge)
    "energy remaining hit #{badge.data}%"
  end

end
