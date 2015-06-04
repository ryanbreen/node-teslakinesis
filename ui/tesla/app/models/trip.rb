class Trip < ActiveRecord::Base

  has_many :vehicle_telemetry_metrics

  def change
    create_table :trips do |t|
      t.string :vehicle_id
      t.timestamp :start
      t.timestamp :end
    end

    add_index :trips, :vehicle_id


end
