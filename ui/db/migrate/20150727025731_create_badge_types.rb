class CreateBadgeTypes < ActiveRecord::Migration
  def change
    create_table :badge_types do |t|
      t.string :name
      t.string :description
      t.string :icon
      t.string :flavor
      t.timestamps
    end
  end
end
