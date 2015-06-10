class CreateVehicles < ActiveRecord::Migration
  def change
    create_table :vehicles, :id => false do |t|
      t.string :vehicle_id, :limit => 30, :primary => true
      t.string :name

      t.timestamps
    end
  end
end
