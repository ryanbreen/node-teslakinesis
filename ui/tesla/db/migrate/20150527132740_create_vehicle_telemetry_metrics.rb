class CreateVehicleTelemetryMetrics < ActiveRecord::Migration
  def change
    create_table :vehicle_telemetry_metrics do |t|
      t.string :vehicle_id
      t.timestamp :timestamp
      t.integer :speed
      t.float :odometer
      t.integer :soc
      t.integer :elevation
      t.integer :est_heading
      t.integer :heading
      t.point :location, geographic: true, has_z: true
      t.integer :power
      t.string :shift_state, limit: 1
      t.integer :range
      t.integer :est_range
      t.timestamps null: false
    end

    add_index :vehicle_telemetry_metrics, :vehicle_id
    add_index :vehicle_telemetry_metrics, :timestamp
  end
end
