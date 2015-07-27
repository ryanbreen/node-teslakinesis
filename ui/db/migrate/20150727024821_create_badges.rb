class CreateBadges < ActiveRecord::Migration
  def change
    create_table :badges do |t|

      t.timestamps
    end
  end
end
