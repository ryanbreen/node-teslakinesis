class ToTheSeaBadgeType < BadgeType

  def to_description(badge)
    "You traveled all the way to longitude #{badge.data}."
  end

end
