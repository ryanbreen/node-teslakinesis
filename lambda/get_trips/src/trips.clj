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

(defn -get []
  (let [db_creds (creds)]
    (pprint db_creds)
    (let [result (sql/query db_creds
      ["select * from trips limit 10;"])]
      (pprint result)
      (str result))))

;(println (-get))
;(pprint (-get))