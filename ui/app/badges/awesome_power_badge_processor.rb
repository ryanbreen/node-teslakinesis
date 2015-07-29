class AwesomePowerBadgeProcessor < BadgeProcessor

  def initialize(trip_detail)
    super 2, trip_detail
  end

  def process_metric(metric)
    return if @finalized

    if metric.power > 220
      finalize metric
    end
  end

end