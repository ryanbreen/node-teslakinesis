class AddTrueDurationToTripDetails < ActiveRecord::Migration
  def change
    add_column :trip_details, :true_duration, :integer
  end
end
