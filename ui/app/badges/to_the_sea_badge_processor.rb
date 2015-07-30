class ToTheSeaBadgeProcessor < BadgeProcessor

  self.badge_type_id = 4

  def initialize(trip_detail)
    super trip_detail
    @current_most_easterly = -180.0
  end

  def process_metric(metric)
    if metric.location.x > @current_most_easterly
      @current_most_easterly = metric.location.x
      @current_metric = metric
    end
  end

  def metrics_complete()
    # if this is farther east than the current globally farthest east, delete the current
    # badge and add a new one
    badge = Badge.find_by vehicle_id: @trip_detail.trip.vehicle_id, badge_type_id: 4
    if badge != nil
      if @current_most_easterly > badge.vehicle_telemetry_metric.location.x
        badge.destroy
        create_badge @current_metric
      end 
    elsif
      # If there is no current badge, this is automatically the most superlative trip we've taken
      create_badge @current_metric
    end
  end

end