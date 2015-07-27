class RemoveFieldsFromTrips < ActiveRecord::Migration
  def self.up
    remove_column :trips, :sash_id
    remove_column :trips, :level
  end
end
