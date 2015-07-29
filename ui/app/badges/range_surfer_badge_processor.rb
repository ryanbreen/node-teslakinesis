class RangeSurferBadgeProcessor < BadgeProcessor

  def initialize(trip_detail)
    super 9, trip_detail  
    @current_lowest_soc
    @current_metric
  end

  def process_metric(metric)
    return if @finalized

    if metric.soc < 25
      @current_lowest_soc = metric.soc
      @current_metric = metric
    end
  end

  def metrics_complete()
    finalize @current_metric
  end

end