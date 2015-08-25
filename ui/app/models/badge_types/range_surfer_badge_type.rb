class RangeSurferBadgeType < BadgeType

  @current_lowest_soc = 180.0

  def initialize_copy(original)
    @last_issued = 4611686018427387903
    @current_lowest_soc = 180.0
    self[:id] = original.id
  end
  
  def process_metric(trip_detail, metric)
    if metric.soc < 25 and metric.soc < @current_lowest_soc
      @current_lowest_soc = metric.soc
      @current_metric = metric
    end
  end

  def metrics_complete(trip_detail)
    create_badge trip_detail, @current_metric, @current_metric.soc if @current_metric != nil
  end

  def to_description(badge)
    "Energy remaining reached a low of #{badge.data}%."
  end

end
