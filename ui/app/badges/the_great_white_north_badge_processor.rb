class TheGreatWhiteNorthBadgeProcessor < BadgeProcessor

  self.badge_type_id = 5

  def initialize(trip_detail)
    super trip_detail
    @current_most_northerly = -90.0
  end

  def process_metric(metric)
    return if @finalized

    if metric.location.y > @current_most_northerly
      @current_most_northerly = metric.location.y
      @current_metric = metric
    end
  end

  def metrics_complete()
    # if this is farther west than the current globally farthest west, delete the current
    # badge and add a new one
    badge = Badge.find_by vehicle_id: @trip_detail.trip.vehicle_id, badge_type_id: 5
    if badge != nil
      if @current_most_northerly > badge.vehicle_telemetry_metric.location.y
        badge.destroy
        finalize @current_metric
      end 
    else
      # If there is no current badge, this is automatically the most superlative trip we've taken
      finalize @current_metric
    end
  end

end