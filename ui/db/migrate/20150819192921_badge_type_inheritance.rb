class BadgeTypeInheritance < ActiveRecord::Migration
  def change
    add_column :badge_types, :type, :string
  end
end
