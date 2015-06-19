class AddLocationColumnsToTrips < ActiveRecord::Migration
  def change
    add_column :trips, :start_location_id, :integer
    add_column :trips, :end_location_id, :integer
  end
end
