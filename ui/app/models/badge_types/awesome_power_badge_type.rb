class AwesomePowerBadgeType < BadgeType

  def to_description(badge)
    "You reached a peak energy consumption of #{badge.data}."
  end

end
