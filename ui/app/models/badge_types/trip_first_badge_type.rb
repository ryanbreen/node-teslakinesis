class TripFirstBadgeType < BadgeType

  def process_metric(trip_detail, metric)
    # We want the current metric in this case to be the most recent metric.
    @current_metric = metric
  end

  def create_badge(trip, data, badge_type_id)
    # The last metric for this trip is what we should associate with this badge.  It's when
    # the trip ended.
    metric = VehicleTelemetryMetric.where(:trip_id => trip.id).order('id DESC').limit(1)

    Badge.create(
      :vehicle_id => trip[:vehicle_id],
      :trip_id => trip.id,
      :trip_detail_id => trip.trip_detail.id,
      :vehicle_telemetry_metric_id => metric[0].id,
      :badge_type_id => badge_type_id,
      :data => data
    )
  end

  def to_description(badge)
    "The total duration of the trip was #{distance_of_time_in_words badge.data.to_i}."
  end

end
