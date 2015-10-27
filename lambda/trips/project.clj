(defproject trips "0.1.0-SNAPSHOT"
  :description "Interfaces for interacting with trip data"
  :url "https://api.ryanbreen.com/v1/trips"
  :dependencies [[org.clojure/clojure "1.7.0"]
                 [org.clojure/clojurescript "0.0-3308"]
                 [org.clojure/core.async "0.1.346.0-17112a-alpha"]
                 [io.nervous/cljs-lambda "0.1.2"]
                 [org.clojure/java.jdbc "0.4.1"]
                 [org.postgresql/postgresql "9.4-1204-jdbc41"]]
  :plugins [[org.clojure/data.json "0.2.6"]
            [lein-cljsbuild "1.0.6"]
            [lein-npm "0.5.0"]
            [io.nervous/lein-cljs-lambda "0.2.4"]]
  :node-dependencies [[source-map-support "0.2.8"]
                      [pg "4.4.3"]]
  :source-paths ["src"]
  :cljs-lambda
  {:defaults {:role "arn:aws:iam::465070256155:role/lambda_apig_role"}
   :functions
   [{:name   "get-trips"
     :invoke trips.core/get-trips}]}
  :cljsbuild
  {:builds [{:id "trips"
             :source-paths ["src"]
             :compiler {:output-to "out/trips.js"
                        :output-dir "out"
                        :target :nodejs
                        :optimizations :none
                        :source-map true}}]})
