class CreateBadges < ActiveRecord::Migration
  def change
    create_table :badges do |t|
      t.integer :trip_id
      t.integer :trip_detail_id
      t.integer :vehicle_telemetry_metric_id
      t.integer :badge_type_id
      t.string :data

      t.timestamps
    end

    add_index :badges, :trip_id
    add_index :badges, :trip_detail_id
    add_index :badges, :badge_type_id
  end
end
