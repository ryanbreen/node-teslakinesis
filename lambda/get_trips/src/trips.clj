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
  (sql/query (creds)
    ["select * from trips limit 10;"]))

(println (-get))
;(pprint (-get))