class GoWestYoungManBadgeType < BadgeType

  @current_most_westerly = 180.0

  def initialize_copy(original)
    @last_issued = 4611686018427387903
    @current_most_westerly = 180.0
    self[:id] = original.id
  end

  def process_metric(trip_detail, metric)
    if metric.location.x < @current_most_westerly
      @current_most_westerly = metric.location.x
      @current_metric = metric
    end
  end

  def metrics_complete(trip_detail)
    # if this is farther west than the current globally farthest west, delete the current
    # badge and add a new one
    badge = Badge.find_by vehicle_id: trip_detail.trip.vehicle_id, badge_type_id: id
    if badge != nil
      if @current_most_westerly < badge.vehicle_telemetry_metric.location.x
        Badge.where(vehicle_id: trip_detail.trip.vehicle_id, badge_type_id: id).destroy_all
        create_badge trip_detail, @current_metric, @current_most_westerly
      end 
    else
      # If there is no current badge, this is automatically the most superlative trip we've taken
      create_badge trip_detail, @current_metric, @current_most_westerly
    end
  end

  def to_description(badge)
    "You traveled all the way to longitude #{badge.data}."
  end

end
