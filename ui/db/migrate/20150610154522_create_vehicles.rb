class CreateVehicles < ActiveRecord::Migration
  def change
    create_table :vehicles, :id => false do |t|
      t.primary_key :vehicle_id, :string, :limit => 30
      t.string :name

      t.timestamps
    end
  end
end
