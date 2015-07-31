class RangeSurferBadgeProcessor < BadgeProcessor

  self.badge_type_id = 9

  def initialize(trip_detail)
    super trip_detail
    @current_lowest_soc = 180.0
  end
  
  def process_metric(metric)
    if metric.soc < 25 and metric.soc < @current_lowest_soc
      @current_lowest_soc = metric.soc
      @current_metric = metric
    end
  end

  def metrics_complete()
    create_badge @current_metric, @current_metric.soc if @current_metric != nil
  end

end