class AwesomePowerBadgeType < BadgeType

  def process_metric(trip_detail, metric)
    if metric.power > 220
      create_badge trip_detail, metric, metric.power
    end
  end

  def to_description(badge)
    "You reached a peak energy consumption of #{badge.data}."
  end

end
