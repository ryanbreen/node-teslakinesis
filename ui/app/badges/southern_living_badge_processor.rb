class SouthernLivingBadgeProcessor < BadgeProcessor

  def initialize(trip_detail)
    super 6, trip_detail
    @current_most_southerly = 90.0
  end

  def process_metric(metric)
    return if @finalized

    if metric.location.y < @current_most_southerly
      @current_most_southerly = metric.location.y
      @current_metric = metric
    end
  end

  def metrics_complete()
    # if this is farther south than the current globally farthest south, delete the current
    # badge and add a new one
    badge = Badge.find_by vehicle_id: @trip_detail.trip.vehicle_id, badge_type_id: 6
    if badge != nil
      if @current_most_southerly < badge.vehicle_telemetry_metric.location.y
        badge.destroy
        finalize @current_metric
      end 
    else
      # If there is no current badge, this is automatically the most superlative trip we've taken
      finalize @current_metric
    end
  end

end