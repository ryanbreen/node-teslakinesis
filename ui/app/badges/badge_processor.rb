class BadgeProcessor
  @badge_type_id = 0
  @finalized = false

  def initialize(badge_type_id, trip_detail)
    @badge_type_id = badge_type_id
    @trip_detail = trip_detail

    @finalized = ((Badge.find_by trip_id: @trip_detail.id, badge_type_id: @badge_type_id) != nil)
  end

  def self.badge_type_id
    @badge_type_id
  end

  def self.badge_type_id=(id)
    @badge_type_id = id
  end

  def finalize(metric)
    return if metric == nil
    Badge.create(
      :vehicle_id => @trip_detail.vehicle_id,
      :trip_id => @trip_detail.trip_id,
      :trip_detail_id => @trip_detail.id,
      :vehicle_telemetry_metric_id => metric.id,
      :badge_type_id => @badge_type_id
    )
    @finalized = true
  end

  def process_metric(metric)

  end

  def metrics_complete()

  end
end