Rails.application.routes.draw do
  resources :vehicles do
    resources :trips, only: [:index]
    resources :locations
  end

  resources :trips, only: [:show], :as => :trip

end
