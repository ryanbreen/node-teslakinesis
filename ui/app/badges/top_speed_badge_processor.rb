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
    # if this is the fastest we've gone, delete any prior badge for this vehicle
    badge = Badge.find_by vehicle_id: @trip_detail.trip.vehicle_id, badge_type_id: self.class.badge_type_id
    if badge != nil
      if @current_top_speed > badge.vehicle_telemetry_metric.speed
        Badge.where(vehicle_id: @trip_detail.trip.vehicle_id, badge_type_id: self.class.badge_type_id).destroy_all
        create_badge @current_metric, @current_top_speed
      end 
    else
      # If there is no current badge, this is automatically the most superlative trip we've taken
      create_badge @current_metric, @current_top_speed
    end
  end

end