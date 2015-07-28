class RangeSurferBadgeProcessor < BadgeProcessor

  self.badge_type_id = 9

  def process_metric(metric)
    return if @finalized

    # TODO: Run this after the trip has been fully processed to grab the lowest metric.
    if metric.soc < 20
      finalize metric
    end
  end

end