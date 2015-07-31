class TopSpeedBadgeProcessor < BadgeProcessor

  self.badge_type_id = 7

  def initialize(trip_detail)
    super trip_detail
    @current_top_speed = 0
  end

  def process_metric(metric)
    if metric.speed > @current_top_speed
      @current_top_speed = metric.speed
      @current_metric = metric
    end
  end

  def metrics_complete()
    # if this is farther west than the current globally farthest west, delete the current
    # badge and add a new one
    badge = Badge.find_by vehicle_id: @trip_detail.trip.vehicle_id, badge_type_id: 7
    if badge != nil
      if @current_top_speed > badge.vehicle_telemetry_metric.speed
        badge.destroy
        create_badge @current_metric, @current_top_speed
      end 
    else
      # If there is no current badge, this is automatically the most superlative trip we've taken
      create_badge @current_metric, @current_top_speed
    end
  end

end