(ns trips.core
  (:require
    [cljs-lambda.util :refer [async-lambda-fn]]
    [trips.creds.db :as db-creds])
  (:require-macros [cljs.core.async.macros :refer [go]]))

(def fs (cljs.nodejs/require "fs"))
(def pg (cljs.nodejs/require "pg"))
(def conn db-creds/connection-string)
(def client (pg.Client. conn))

(def ^:export get-trips
  (async-lambda-fn
   (fn [{:keys [page]} context]
     (go
      (.connect client 
        (fn [err] 
          (if err
            (js/Error. (str "Couldn't connect" err))
            (.query client "select * from trip_details limit 5;" 
              (fn [err result] 
               (if err 
                 (.error js/console "Query error" err)
                 (do
                   (.log js/console result.rows)
                   (.end client)
                   (js/Success. "Happy"))))))))))))
