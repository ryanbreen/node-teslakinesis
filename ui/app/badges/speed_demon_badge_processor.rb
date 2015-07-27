class SpeedDemonBadgeProcessor < BadgeProcessor

  def initialize(trip_detail)
    @trip_detail = trip_detail
    puts "Trip detail is #{@trip_detail}"
    puts "Trip detail id is #{@trip_detail.trip_id}"
  end

  def process_metric(metric)
    return if @finalized

    if metric.speed > 40
      puts "Found a sweet metric speed."
      finalize metric
    end
  end

  def finalize(metric)
    Badge.create(
      :trip_id => @trip_detail.trip_id,
      :trip_detail_id => @trip_detail.id,
      :vehicle_telemetry_metric_id => metric.id,
      :badge_type_id => 1
    )
    @finalized = true
  end

end