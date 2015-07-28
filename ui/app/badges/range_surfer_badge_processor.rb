class RangeSurferBadgeProcessor < BadgeProcessor

  self.badge_type_id = 9

  @current_lowest_soc
  @current_metric

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