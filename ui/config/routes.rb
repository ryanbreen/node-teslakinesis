Rails.application.routes.draw do
  get "/auth/auth0/callback" => "auth0#callback"
  get "/auth/failure" => "auth0#failure"

  resources :vehicles do
    resources :locations
    resources :trips

    get 'trips/from/:from/to/:to', to: 'trips#between', as: 'trips_between', :constraints => { :from => /[^\/]+/, :to => /[^\/]+/ }
    get 'trips/from/:from', to: 'trips#from', as: 'trips_from', :constraints => { :from => /[^\/]+/ }
    get 'trips/to/:to', to: 'trips#to', as: 'trips_to', :constraints => { :to => /[^\/]+/ }
    get 'vehicle_telemetry_metrics/:trip_id', to: 'vehicle_telemetry_metrics#trip_metrics'
  end

end
