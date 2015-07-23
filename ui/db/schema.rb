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

ActiveRecord::Schema.define(version: 20150723014633) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"
  enable_extension "postgis"

  create_table "badges_sashes", force: true do |t|
    t.integer  "badge_id"
    t.integer  "sash_id"
    t.boolean  "notified_user", default: false
    t.datetime "created_at"
  end

  add_index "badges_sashes", ["badge_id", "sash_id"], :name => "index_badges_sashes_on_badge_id_and_sash_id"
  add_index "badges_sashes", ["badge_id"], :name => "index_badges_sashes_on_badge_id"
  add_index "badges_sashes", ["sash_id"], :name => "index_badges_sashes_on_sash_id"

  create_table "locations", force: true do |t|
    t.string   "vehicle_id"
    t.string   "name"
    t.spatial  "geolocation", limit: {:srid=>4326, :type=>"point", :has_z=>true, :geographic=>true}
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "locations", ["geolocation"], :name => "index_locations_on_geolocation", :spatial => true
  add_index "locations", ["vehicle_id", "name"], :name => "index_locations_on_vehicle_id_and_name", :unique => true
  add_index "locations", ["vehicle_id"], :name => "index_locations_on_vehicle_id"

  create_table "merit_actions", force: true do |t|
    t.integer  "user_id"
    t.string   "action_method"
    t.integer  "action_value"
    t.boolean  "had_errors",    default: false
    t.string   "target_model"
    t.integer  "target_id"
    t.text     "target_data"
    t.boolean  "processed",     default: false
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "merit_activity_logs", force: true do |t|
    t.integer  "action_id"
    t.string   "related_change_type"
    t.integer  "related_change_id"
    t.string   "description"
    t.datetime "created_at"
  end

  create_table "merit_score_points", force: true do |t|
    t.integer  "score_id"
    t.integer  "num_points", default: 0
    t.string   "log"
    t.datetime "created_at"
  end

  create_table "merit_scores", force: true do |t|
    t.integer "sash_id"
    t.string  "category", default: "default"
  end

  create_table "sashes", force: true do |t|
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "trip_details", force: true do |t|
    t.string   "vehicle_id"
    t.integer  "trip_id"
    t.text     "detailed_route"
    t.text     "summary_route"
    t.datetime "created_at",     null: false
    t.datetime "updated_at",     null: false
  end

  add_index "trip_details", ["trip_id"], :name => "index_trip_details_on_trip_id"

  create_table "trips", force: true do |t|
    t.string   "vehicle_id"
    t.datetime "start_time"
    t.datetime "end_time"
    t.spatial  "start_location",    limit: {:srid=>4326, :type=>"point", :has_z=>true, :geographic=>true}
    t.spatial  "end_location",      limit: {:srid=>4326, :type=>"point", :has_z=>true, :geographic=>true}
    t.datetime "created_at",                                                                                           null: false
    t.datetime "updated_at",                                                                                           null: false
    t.integer  "start_location_id"
    t.integer  "end_location_id"
    t.integer  "sash_id"
    t.integer  "level",                                                                                    default: 0
  end

  add_index "trips", ["end_location"], :name => "index_trips_on_end_location", :spatial => true
  add_index "trips", ["start_location"], :name => "index_trips_on_start_location", :spatial => true

  create_table "vehicle_telemetry_metrics", force: true do |t|
    t.string   "vehicle_id"
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
    t.integer  "trip_id"
  end

  add_index "vehicle_telemetry_metrics", ["location"], :name => "index_vehicle_telemetry_metrics_on_location", :spatial => true
  add_index "vehicle_telemetry_metrics", ["timestamp"], :name => "index_vehicle_telemetry_metrics_on_timestamp"
  add_index "vehicle_telemetry_metrics", ["trip_id"], :name => "index_vehicle_telemetry_metrics_on_trip_id"
  add_index "vehicle_telemetry_metrics", ["vehicle_id"], :name => "index_vehicle_telemetry_metrics_on_vehicle_id"

  create_table "vehicles", primary_key: "vehicle_id", force: true do |t|
    t.string   "name"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

end
