module TripHelper

  def origin_link(trip)
    if trip.origin == nil
      ("Departed from an unknown location (" +
        link_to('name it!', new_vehicle_location_path(:vehicle_id => params[:vehicle_id], 
          :lng => trip[:start_location].longitude, :lat => trip[:start_location].latitude, 
          :z => trip[:start_location].z)) +
        ")").html_safe
    else
      ("Departed " + link_to(trip.origin.name, vehicle_location_path(trip.vehicle_id, trip.origin))).html_safe
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
      ("Departed " + link_to(trip.destination.name, vehicle_location_path(trip.vehicle_id, trip.destination))).html_safe
    end
  end

end
