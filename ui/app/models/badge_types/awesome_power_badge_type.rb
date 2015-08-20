class AwesomePowerBadgeType < BadgeType

  def to_description(badge)
    "hit #{badge.data}KWH"
  end

end
