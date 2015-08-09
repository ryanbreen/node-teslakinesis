class TripRankBadgeProcessor < BadgeProcessor

  def initialize(trip_detail)
    super trip_detail
  end

  def process_metric(metric)
    # We want the current metric in this case to be the most recent metric.
    @current_metric = metric
  end

  def metrics_complete()
    trip = @trip_detal.trip
    return if trip.start_location_id == nil || trip.end_location_id == nil

    top_three_trips =
      Trip.where(
        :vehicle_id => trip.vehicle_id,
        :start_location_id => trip.start_location_id,
        :end_location_id => trip.end_location_id).
      order("EXTRACT(EPOCH FROM (end_time - start_time))").limit(3)

    # Check to see if this trip is in the top 3.  If so, delete all current trip rank badges
    # for this route and create badges for the new 3.
    matched = top_three_trips.select {|t| trip.id = t.id}
    if matched
      Badge.where(
        :vehicle_id => trip.vehicle_id,
        :start_location_id => trip.start_location_id,
        :end_location_id => trip.end_location_id,
        :badge_id => [10, 11, 12]
      ).destroy_all

      top_three_trips.each_with_index do |t, i|
        create_badge trip, i
      end

    else
      # Otherwise, check to see if this is the slowest trip.  If so, delete any current trip
      # for this route badged as slowest and badge this one.
    end
  end

  def create_badge(trip, data)
    # The last metric for this trip is what we should associate with this badge.  It's when
    # the trip ended.
    metric = VehicleTelemetryMetric.where(:trip_id => trip.id).order('id DESC').limit(1)

    Badge.create(
      :vehicle_id => trip.vehicle_id,
      :trip_id => trip.id,
      :trip_detail_id => trip.trip_detail_id,
      :vehicle_telemetry_metric_id => metric.id,
      :badge_type_id => 9 + data, # This works because our badges are 10, 11, and 12 and data will be 1, 2, or 3
      :data => data
    )
  end

end