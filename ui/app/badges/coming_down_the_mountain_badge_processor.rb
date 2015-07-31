class ComingDownTheMountainBadgeProcessor < BadgeProcessor

  self.badge_type_id = 8

  def process_metric(metric)
    if metric.power < -60
      create_badge metric, metric.power
    end
  end

end