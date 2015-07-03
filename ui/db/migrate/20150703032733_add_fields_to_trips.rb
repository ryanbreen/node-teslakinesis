class AddFieldsToTrips < ActiveRecord::Migration
  def change
    add_column :trips, :sash_id, :integer
    add_column :trips, :level,   :integer, :default => 0
  end
end
