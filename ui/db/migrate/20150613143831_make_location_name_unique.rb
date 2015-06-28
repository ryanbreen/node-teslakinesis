class MakeLocationNameUnique < ActiveRecord::Migration
  def change
    add_index :locations, [:vehicle_id, :name], :unique=>true
  end
end
