class CreateBadgeTypes < ActiveRecord::Migration
  def change
    create_table :badge_types do |t|
      t.string :description
      t.string :type
      t.timestamps
    end
  end
end
