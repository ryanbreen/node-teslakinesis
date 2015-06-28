# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20150528144740) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"
  enable_extension "postgis"

  create_table "vehicle_telemetry_metrics", force: true do |t|
    t.string   "vehicle_id",  limit: nil
    t.datetime "timestamp"
    t.integer  "speed"
    t.float    "odometer"
    t.integer  "soc"
    t.integer  "elevation"
    t.integer  "est_heading"
    t.integer  "heading"
    t.spatial  "location",    limit: {:srid=>4326, :type=>"point", :has_z=>true, :geographic=>true}
    t.integer  "power"
    t.string   "shift_state", limit: 1
    t.integer  "range"
    t.integer  "est_range"
    t.datetime "created_at",                                                                         null: false
    t.datetime "updated_at",                                                                         null: false
  end

  add_index "vehicle_telemetry_metrics", ["location"], :name => "index_vehicle_telemetry_metrics_on_location", :spatial => true
  add_index "vehicle_telemetry_metrics", ["timestamp"], :name => "index_vehicle_telemetry_metrics_on_timestamp"
  add_index "vehicle_telemetry_metrics", ["vehicle_id"], :name => "index_vehicle_telemetry_metrics_on_vehicle_id"

end
