class CreateTripDetails < ActiveRecord::Migration
  def change
    create_table :trip_details do |t|
      t.string :vehicle_id
      t.integer :trip_id
      t.text :detailed_route
      t.text :summary_route
      t.text :upper_left
      t.text :lower_right
      t.timestamps null: false
    end

    add_index :trip_details, :trip_id
  end
end
