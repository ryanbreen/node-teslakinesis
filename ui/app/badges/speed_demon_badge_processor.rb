class SpeedDemonBadgeProcessor < BadgeProcessor

  self.badge_type_id = 1

  def process_metric(metric)
    if metric.speed > 90
      create_badge metric
    end
  end

end