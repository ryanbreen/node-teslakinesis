class CreateLocations < ActiveRecord::Migration
  def change
    create_table :locations do |t|
      t.string :vehicle_id
      t.string :name
      t.point :location, geographic: true, has_z: true
      t.timestamps
    end

    add_index :locations, :vehicle_id
    add_index :locations, :location, using: :gist
  end
end
