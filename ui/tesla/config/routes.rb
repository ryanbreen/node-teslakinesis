Rails.application.routes.draw do
  resources :locations

  resources :vehicles do
    resources :trips, only: [:index]
    resources :locations, only: [:index]
  end
  resources :trips, only: [:show], :as => :trip
  resources :locations, only: [:show, :create, :destroy], :as => :location

end
