class AwesomePowerBadgeProcessor < BadgeProcessor

  self.badge_type_id = 2

  def process_metric(metric)
    if metric.power > 220
      create_badge metric
    end
  end

end