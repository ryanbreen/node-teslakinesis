class BadgeProcessor
  @badge_type_id = 0
  @finalized = false

  def initialize(trip_detail)
    @trip_detail = trip_detail
  end

  def self.badge_type_id
    @badge_type_id
  end

  def self.badge_type_id=(id)
    @badge_type_id = id
  end

  def finalize(metric)
    Badge.create(
      :trip_id => @trip_detail.trip_id,
      :trip_detail_id => @trip_detail.id,
      :vehicle_telemetry_metric_id => metric.id,
      :badge_type_id => self.class.badge_type_id
    )
    @finalized = true
  end
end