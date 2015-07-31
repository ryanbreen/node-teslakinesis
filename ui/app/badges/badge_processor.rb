class BadgeProcessor
  @badge_type_id = 0

  def initialize(trip_detail)
    @trip_detail = trip_detail
    @last_issued = 18446744073709551616
  end

  def self.badge_type_id
    @badge_type_id
  end

  def self.badge_type_id=(id)
    @badge_type_id = id
  end

  def create_badge(metric, data)
    return if metric == nil

    # Check whether the last time we issued this badge was less than a minute ago.  We do this
    # so similar badges don't stack up on each other.
    return if ((@last_issued - metric.timestamp.to_i) < 60)

    @last_issued = metric.timestamp.to_i

    Badge.create(
      :vehicle_id => @trip_detail.vehicle_id,
      :trip_id => @trip_detail.trip_id,
      :trip_detail_id => @trip_detail.id,
      :vehicle_telemetry_metric_id => metric.id,
      :badge_type_id => self.class.badge_type_id,
      :data => data
    )
  end

  def process_metric(metric)

  end

  def metrics_complete()

  end
end