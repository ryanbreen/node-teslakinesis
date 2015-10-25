Time::DATE_FORMATS[:long_us] = '%A %B %d, %Y %l:%M%p'
Time::DATE_FORMATS[:date_us] = '%A %B %d, %Y'
Time::DATE_FORMATS[:time_us] = '%l:%M%p'
Time::DATE_FORMATS[:time_precise_us] = '%l:%M:%S.%L %p'

require 'action_view'
require 'action_view/helpers'

module ActionView::Helpers::DateHelper
  def precise_distance_of_time_in_words(from_time, to_time)
    total_distance_in_seconds = to_time - from_time
    puts total_distance_in_seconds.to_s
    distance_in_hours = ((total_distance_in_seconds/60.0)/60.0).floor
    distance_in_minutes = ((total_distance_in_seconds - (distance_in_hours*60.0))/60.0).floor
    distance_in_seconds = (total_distance_in_seconds - (distance_in_minutes*60.0)).floor
    if distance_in_hours > 0
      "#{distance_in_hours}h#{distance_in_minutes}m#{distance_in_seconds}s"
    elsif distance_in_minutes > 0
      "#{distance_in_minutes}m#{distance_in_seconds}s"
    else
      "#{distance_in_seconds}s"
    end
  end
end
