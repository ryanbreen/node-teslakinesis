Rails.application.routes.draw do
  resources :vehicles do
    resources :trips, only: [:index]
    resources :locations
    resources :trips

    get 'trips/from/:from/to/:to', to: 'trips#between', as: 'trips_between'
    get 'trips/from/:from', to: 'trips#from', as: 'trips_from'
    get 'trips/to/:to', to: 'trips#to', as: 'trips_to'
  end

end
