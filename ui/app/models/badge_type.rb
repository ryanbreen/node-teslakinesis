class BadgeType < ActiveRecord::Base

  @last_issued = 4611686018427387903

  def initialize_copy(original)
    @last_issued = 4611686018427387903
    self[:id] = original.id
  end

  def create_badge(trip_detail, metric, data)
    return if metric == nil

    # Check whether the last time we issued this badge was less than a minute ago.  We do this
    # so similar badges don't stack up on each other.
    return if ((@last_issued - metric.timestamp.to_i) < 60)

    @last_issued = metric.timestamp.to_i

    Badge.create(
      :vehicle_id => trip_detail.vehicle_id,
      :trip_id => trip_detail.trip_id,
      :trip_detail_id => trip_detail.id,
      :vehicle_telemetry_metric_id => metric.id,
      :badge_type_id => id,
      :data => data
    )
  end

  def process_metric(trip_detail, metric)

  end

  def metrics_complete(trip_detail)

  end

  def to_description(badge)
    badge.data
  end

end
