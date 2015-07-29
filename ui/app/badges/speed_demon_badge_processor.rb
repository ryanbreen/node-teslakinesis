class SpeedDemonBadgeProcessor < BadgeProcessor

  self.badge_type_id = 1

  def process_metric(metric)
    return if @finalized

    if metric.speed > 90
      finalize metric
    end
  end

end