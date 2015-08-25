class TopSpeedBadgeType < BadgeType

  @current_top_speed = 0

  def initialize_copy(original)
    @last_issued = 4611686018427387903
    @current_top_speed = 0
    self[:id] = original.id
  end

  def process_metric(trip_detail, metric)
    if metric.speed > @current_top_speed
      @current_top_speed = metric.speed
      @current_metric = metric
    end
  end

  def metrics_complete(trip_detail)
    # if this is the fastest we've gone, delete any prior badge for this vehicle
    badge = Badge.find_by vehicle_id: trip_detail.trip.vehicle_id, badge_type_id: id
    if badge != nil
      if @current_top_speed > badge.vehicle_telemetry_metric.speed
        Badge.where(vehicle_id: trip_detail.trip.vehicle_id, badge_type_id: id).destroy_all
        create_badge trip_detail, @current_metric, @current_top_speed
      end 
    else
      # If there is no current badge, this is automatically the most superlative trip we've taken
      create_badge trip_detail, @current_metric, @current_top_speed
    end
  end

  def to_description(badge)
    "You hit #{badge.data}MPH, you asshole.  You're a father now."
  end

end
