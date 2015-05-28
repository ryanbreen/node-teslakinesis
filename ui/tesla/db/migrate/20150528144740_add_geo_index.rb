class AddGeoIndex < ActiveRecord::Migration
  def change
    add_index :vehicle_telemetry_metrics, :location, using: :gist
  end
end
