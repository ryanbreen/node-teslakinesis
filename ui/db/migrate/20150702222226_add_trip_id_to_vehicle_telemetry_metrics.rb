class AddTripIdToVehicleTelemetryMetrics < ActiveRecord::Migration
  def change
    add_column :vehicle_telemetry_metrics, :trip_id, :int

    add_index :vehicle_telemetry_metrics, :trip_id
  end
end
