class SouthernLivingBadgeProcessor < BadgeProcessor

  self.badge_type_id = 6

  def initialize(trip_detail)
    super trip_detail
    @current_most_southerly = 90.0
  end

  def process_metric(metric)
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
        Badge.where(vehicle_id: @trip_detail.trip.vehicle_id, badge_type_id: self.class.badge_type_id).destroy_all
        create_badge @current_metric, @current_most_southerly
      end 
    else
      # If there is no current badge, this is automatically the most superlative trip we've taken
      create_badge @current_metric, @current_most_southerly
    end
  end

end