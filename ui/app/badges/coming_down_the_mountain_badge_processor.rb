class ComingDownTheMountainBadgeProcessor < BadgeProcessor

  def initialize(trip_detail)
    super 8, trip_detail
  end

  def process_metric(metric)
    return if @finalized

    if metric.power < -60
      finalize metric
    end
  end

end