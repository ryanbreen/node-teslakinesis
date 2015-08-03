module TripHelper

  def origin_link(trip)
    if trip.origin == nil
      ("Departed from an unknown location (" +
        link_to('name it!', new_vehicle_location_path(:vehicle_id => params[:vehicle_id], 
          :lng => trip[:start_location].longitude, :lat => trip[:start_location].latitude, 
          :z => trip[:start_location].z)) +
        ")").html_safe
    else
      ("Departed from " + link_to(trip.origin.name, vehicle_location_path(trip.vehicle_id, trip.origin))).html_safe
    end
  end

  def destination_link(trip)
    if trip.destination == nil
      ("Arrived at an unknown location (" +
        link_to('name it!', new_vehicle_location_path(:vehicle_id => params[:vehicle_id], 
          :lng => trip[:end_location].longitude, :lat => trip[:end_location].latitude, 
          :z => trip[:end_location].z)) +
        ")").html_safe
    else
      ("Arrived at " + link_to(trip.destination.name, vehicle_location_path(trip.vehicle_id, trip.destination))).html_safe
    end
  end

  def from_name_short(trip)
    trip.origin != nil ? trip.origin.name : "unknown origin"
  end

  def from_name(trip)
    (trip.origin != nil ? trip.origin.name : "unknown origin (" + 
      link_to('Name it!', new_vehicle_location_path(:vehicle_id => params[:vehicle_id], 
        :lng => trip[:start_location].longitude, :lat => trip[:start_location].latitude, 
        :z => trip[:start_location].z)) + ")").html_safe
  end

  def from_name_linked(trip)
    (trip.origin != nil ? 
      link_to(trip.origin.name, vehicle_location_path(trip.vehicle_id, trip.origin)) :
      "unknown origin (#{link_to('Name it!', new_vehicle_location_path(:vehicle_id => params[:vehicle_id], 
        :lng => trip[:start_location].longitude, :lat => trip[:start_location].latitude, 
        :z => trip[:start_location].z))})").html_safe
  end

  def to_name_short(trip)
    trip.destination != nil ? trip.destination.name : "unknown destination"
  end

  def to_name(trip)
    (trip.destination != nil ? trip.destination.name : "unknown destination (" + 
      link_to('Name it!', new_vehicle_location_path(:vehicle_id => params[:vehicle_id], 
        :lng => trip[:end_location].longitude, :lat => trip[:end_location].latitude, 
        :z => trip[:end_location].z)) + ")").html_safe unless trip[:end_location] == nil
  end

  def to_name_linked(trip)
    (trip.destination != nil ?
      link_to(trip.destination.name, vehicle_location_path(trip.vehicle_id, trip.destination)) :
      "unknown destination (" + 
      link_to('Name it!', new_vehicle_location_path(:vehicle_id => params[:vehicle_id], 
        :lng => trip[:end_location].longitude, :lat => trip[:end_location].latitude, 
        :z => trip[:end_location].z)) + ")" unless trip[:end_location] == nil).html_safe
  end

  def trip_between_summary(trip)
    if trip.end_time == nil
      ("Ongoing trip from #{from_name(trip)}").html_safe
    else
      ("Trip from #{from_name(trip)} to #{to_name(trip)}").html_safe
    end
  end

  def trip_destination_summary(trip)
    (trip.end_time == nil ? 'ongoing' : to_name_linked(trip)).html_safe
  end

end
