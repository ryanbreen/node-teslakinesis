(ns trips
  (:gen-class
   :methods [^:static [get [] Object]])
  (:use [clojure.java.io :as io]
        [clojure.data.json :as json]
        [clojure.java.jdbc :as sql]))

(defn creds []
  (slurp
    (io/file
      (io/resource
        "creds/db.creds" ))))

(defn my-value-writer [key value]
  ;(pprint (type value))
  (pprint key)
  (pprint (str (type value)))
  (cond
    (= (str (type value)) "class java.sql.Timestamp") (.toString value)
    (= (str (type value)) "class org.postgresql.util.PGobject") (.toString value)
    :else value))

(defn -get []
  (let [db_creds (creds)]
    (let [result (sql/query db_creds
      ["select start_time, start_location_id, st_asgeojson(start_location) as start_location, end_time, end_location_id, st_asgeojson(end_location) as end_location from trips limit 10;"])]
      (json/read-str
        (json/write-str result
          :value-fn my-value-writer)))))