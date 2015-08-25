class SpeedDemonBadgeType < BadgeType

  def process_metric(trip_detail, metric)
    if metric.speed > 90
      create_badge trip_detail, metric, metric.speed
    end
  end

  def to_description(badge)
    "You hit #{badge.data}MPH, you maniac."
  end

end
