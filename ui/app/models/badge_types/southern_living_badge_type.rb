class SouthernLivingBadgeType < BadgeType
  
  @current_most_southerly = 90.0

  def initialize_copy(original)
    @last_issued = 4611686018427387903
    @current_most_southerly = 90.0
    self[:id] = original.id
  end

  def process_metric(trip_detail, metric)
    if metric.location.y < @current_most_southerly
      @current_most_southerly = metric.location.y
      @current_metric = metric
    end
  end

  def metrics_complete(trip_detail)
    # if this is farther south than the current globally farthest south, delete the current
    # badge and add a new one
    badge = Badge.find_by vehicle_id: trip_detail.trip.vehicle_id, badge_type_id: id
    if badge != nil
      if @current_most_southerly < badge.vehicle_telemetry_metric.location.y
        Badge.where(vehicle_id: trip_detail.trip.vehicle_id, badge_type_id: id).destroy_all
        create_badge trip_detail, @current_metric, @current_most_southerly
      end 
    else
      # If there is no current badge, this is automatically the most superlative trip we've taken
      create_badge trip_detail, @current_metric, @current_most_southerly
    end
  end

  def to_description(badge)
    "You traveled all the way to latitude #{badge.data}."
  end

end
