(ns trips
  (:gen-class
   :implements [com.amazonaws.services.lambda.runtime.RequestStreamHandler])
  (:use [clojure.java.io :as io]
        [clojure.data.json :as json]
        [clojure.java.jdbc :as sql]))

(defn creds []
  (-> "creds/db.creds" (io/resource) (io/file) slurp))

(defn my-value-writer [key value]
  (cond
    (= (str (type value)) "class java.sql.Timestamp") (.toString value)
    (or (= key :start_location) (= key :end_location)) (json/read-str value)
    :else value))

(defn -handleRequest [this is os context]
  (let [w (io/writer os)]
    (let [db_creds (creds)]
      (let [result (sql/query db_creds
        ["select start_time, start_location_id, st_asgeojson(start_location) as start_location, end_time, end_location_id, st_asgeojson(end_location) as end_location from trips limit 10;"])]
        (let [w (io/writer os)]
          (-> (json/read-str (json/write-str result :value-fn my-value-writer))
              (json/write w))
          (.flush w))))))