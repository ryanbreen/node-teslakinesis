(ns trips
  (:gen-class
   :methods [^:static [get [] String]])
  (:use [clojure.java.io :as io]
        [clojure.data.json :as json]
        [clojure.java.jdbc :as sql]))

(defn creds []
  (slurp
    (io/file
      (io/resource
        "creds/db.creds" ))))

(defn my-value-reader [key value]
  (if (= (type value) "java.sql.Timestamp")
    (java.sql.Timestamp/valueOf value)
    value))

(defn -get []
  (let [db_creds (creds)]
    (pprint db_creds)
    (let [result (sql/query db_creds
      ["select * from trips limit 10;"])]
      (pprint (apply str result))
      (apply str result))))
;      (pprint
;        (str
;          (json/read-str (apply str result)
;            :value-fn my-value-reader
;            :key-fn keyword)))
;      (str
;        (json/read-str (apply str result)
 ;         :value-fn my-value-reader
 ;         :key-fn keyword)))))

;(println (-get))
;(pprint (-get))