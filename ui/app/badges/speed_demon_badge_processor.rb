class SpeedDemonBadgeProcessor < BadgeProcessor

  def initialize(trip_detail)
    super 1, trip_detail
  end

  def process_metric(metric)
    return if @finalized

    if metric.speed > 90
      finalize metric
    end
  end

end