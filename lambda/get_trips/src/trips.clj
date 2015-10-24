(ns trips
  (:gen-class
   :methods [^:static [get [] String]])
  (:use [clojure.java.io :as io]
        [clojure.data.json :as json]
        [amazonica.aws.kinesis]))

(defn my-value-writer [key value]
  (if (= key :attach-time)
    (str (org.joda.time.DateTime. (.toString value)))
    value)
  (if (= key :launch-time)
    (str (org.joda.time.DateTime. (.toString value)))
    value))

(defn creds []
  (read-string
    (slurp
      (io/file
        (io/resource
          "creds/aws.creds" )))))

(defn -get []
  (json/write-str (list-streams (creds)) :value-fn my-value-writer))
  ;(print-str (describe-instances cred) :value-fn my-value-writer))

(println (-get))
;(pprint (-get))