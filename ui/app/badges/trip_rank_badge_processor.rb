class TripRankBadgeProcessor < BadgeProcessor

  def initialize(trip_detail)
    super trip_detail
  end

  def process_metric(metric)
    # We want the current metric in this case to be the most recent metric.
    @current_metric = metric
  end

  def metrics_complete()
    trip = @trip_detail.trip
    return if trip.start_location_id == nil || trip.end_location_id == nil

    top_three_trips =
      Trip.where(
        :vehicle_id => trip[:vehicle_id],
        :start_location_id => trip.start_location_id,
        :end_location_id => trip.end_location_id).
      order("EXTRACT(EPOCH FROM (end_time - start_time))").limit(4).to_a
    at_least_four = top_three_trips.length == 4

    # Pop off the 4th element so that there are really 3 trips.
    top_three_trips.pop if at_least_four
    puts "there are now #{top_three_trips.length} trips in array"

    # Check to see if this trip is in the top 3.  If so, delete all current trip rank badges
    # for this route and create badges for the new 3.
    matched = top_three_trips.select {|t| trip.id = t.id}
    # Make sure each trip has its trip_detail object initiated.  We want to do this before
    # adding badges or we will get into a weird loop where this badge is being created by
    # trips in the top_three_trips array after we've deleted dupes.
    top_three_trips.each {|t| t.trip_detail}
    if matched
      Badge.where(
        :vehicle_id => trip[:vehicle_id],
        :trip_id => Trip.where(
          :vehicle_id => trip[:vehicle_id],
          :start_location_id => trip.start_location_id,
          :end_location_id => trip.end_location_id
        ),
        :badge_type_id => [10, 11, 12]
      ).delete_all

      top_three_trips.each_with_index do |t, i|
        puts "Creating badge at rank #{i} for trip #{t.id} from #{trip.start_location_id} to #{trip.end_location_id}"
        create_badge t, (i + 1)
      end

    end

    # If there are at least 4 trips (meaning, there's room for a top 3 and a last place),
    # calculate last place.
    if at_least_four
      # Check to see if this is the slowest trip.  If so, delete any current trip
      # for this route badged as slowest and badge this one.
      slowest_trip =
        Trip.where(
          :vehicle_id => trip[:vehicle_id],
          :start_location_id => trip.start_location_id,
          :end_location_id => trip.end_location_id).
        order("EXTRACT(EPOCH FROM (end_time - start_time)) DESC").limit(1)[0]

      # Delete any previous slowest and create a badge
      Badge.where(
        :vehicle_id => trip[:vehicle_id],
        :trip_id => Trip.where(
          :vehicle_id => trip[:vehicle_id],
          :start_location_id => trip.start_location_id,
          :end_location_id => trip.end_location_id
        ),
        :badge_type_id => 13
      ).delete_all
      create_badge slowest_trip, 13
    end
  end

  def create_badge(trip, data)
    # The last metric for this trip is what we should associate with this badge.  It's when
    # the trip ended.
    metric = VehicleTelemetryMetric.where(:trip_id => trip.id).order('id DESC').limit(1)

    badge_type_id = data
    # This works because our badges are 10, 11, and 12 and data will be 1, 2, or 3
    badge_type_id = 9 + data unless badge_type_id == 13

    Badge.create(
      :vehicle_id => trip[:vehicle_id],
      :trip_id => trip.id,
      :trip_detail_id => trip.trip_detail.id,
      :vehicle_telemetry_metric_id => metric[0].id,
      :badge_type_id => badge_type_id,
      :data => data
    )
  end

end