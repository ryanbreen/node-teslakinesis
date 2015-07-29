class AwesomePowerBadgeProcessor < BadgeProcessor

  self.badge_type_id = 2

  def process_metric(metric)
    return if @finalized

    if metric.power > 220
      finalize metric
    end
  end

end