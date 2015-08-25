class ComingDownTheMountainBadgeType < BadgeType

  def process_metric(trip_detail, metric)
    if metric.power < -60
      create_badge trip_detail, metric, metric.power
    end
  end

  def to_description(badge)
    "You reached a peak energy regen of #{badge.data}KW."
  end

end
