Rails.application.routes.draw do
  resources :vehicles do
    resources :trips, only: [:index]
    resources :locations
  end

  resources :trips, only: [:show], :as => :trip
  get 'vehicles/:vehicle_id/trips/:from/:to', to: 'trips#between', as: 'vehicle_trips_between'
  get 'vehicles/:vehicle_id/trips/:from', to: 'trips#from', as: 'vehicle_trips_from'
  get 'vehicles/:vehicle_id/trips/:to', to: 'trips#to', as: 'vehicle_trips_to'

end
