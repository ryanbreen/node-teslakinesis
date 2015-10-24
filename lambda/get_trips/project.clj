(defproject get-trips "0.1.0"
  :dependencies [[org.clojure/clojure "1.7.0"]
                 [org.clojure/data.json "0.2.6"]
                 [com.amazonaws/aws-lambda-java-core "1.0.0"]
                 [amazonica "0.3.35"]
                 [clj-time "0.11.0"]]
  :java-source-paths ["src/java"]
  :aot :all)
