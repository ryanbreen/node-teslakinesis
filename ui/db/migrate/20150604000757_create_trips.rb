class CreateTrips < ActiveRecord::Migration
  def change
    create_table :trips do |t|
      t.string :vehicle_id
      t.timestamp :start_time
      t.timestamp :end_time
      t.point :start_location, geographic: true, has_z: true
      t.point :end_location, geographic: true, has_z: true
      t.timestamps null: false
    end

    add_index :trips, :start_location, using: :gist
    add_index :trips, :end_location, using: :gist
  end
end
