class GoWestYoungManBadgeProcessor < BadgeProcessor

  self.badge_type_id = 3

  def initialize(trip_detail)
    super trip_detail
    @current_most_westerly = 180.0
  end

  def process_metric(metric)
    if metric.location.x < @current_most_westerly
      @current_most_westerly = metric.location.x
      @current_metric = metric
    end
  end

  def metrics_complete()
    # if this is farther west than the current globally farthest west, delete the current
    # badge and add a new one
    badge = Badge.find_by vehicle_id: @trip_detail.trip.vehicle_id, badge_type_id: 3
    if badge != nil
      if @current_most_westerly < badge.vehicle_telemetry_metric.location.x
        Badge.where(vehicle_id: @trip_detail.trip.vehicle_id, badge_type_id: self.class.badge_type_id).destroy_all
        create_badge @current_metric, @current_most_westerly
      end 
    else
      # If there is no current badge, this is automatically the most superlative trip we've taken
      create_badge @current_metric, @current_most_westerly
    end
  end

end