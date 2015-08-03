module FormattedTimeHelper

  def pretty_start_date(trip)
    now = Time.zone.now.in_time_zone('America/New_York')
    current_date = now.to_date
    trip_date = trip.start_time.in_time_zone('America/New_York').to_date
    (current_date == trip_date) ? "Today" : 
      (current_date.yesterday == trip_date) ? "Yesterday" :
        trip.start_time.in_time_zone('America/New_York').to_formatted_s(:date_us)
  end

  def pretty_duration(trip, summarize = false)
    if trip.end_time != nil
      return "in #{distance_of_time_in_words(trip.start_time, trip.end_time, include_seconds: true)}" if summarize
      distance_of_time_in_words(trip.start_time, trip.end_time, include_seconds: true)
    elsif summarize
      "is ongoing"
    else
      distance_of_time_in_words(trip.start_time, DateTime.now, include_seconds: true)
    end
  end

  def pretty_precise_duration(trip)
    if trip.end_time != nil
      precise_distance_of_time_in_words(trip.start_time, trip.end_time)
    else
      precise_distance_of_time_in_words(trip.start_time, Time.now)
    end
  end

end