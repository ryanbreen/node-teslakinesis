class ComingDownTheMountainBadgeProcessor < BadgeProcessor

  self.badge_type_id = 8

  def process_metric(metric)
    return if @finalized

    if metric.power < -60
      finalize metric
    end
  end

end