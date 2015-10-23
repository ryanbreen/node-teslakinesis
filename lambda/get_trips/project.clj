(defproject get-trips "0.1.0"
  :dependencies [[org.clojure/clojure "1.7.0"]
                 [org.clojure/data.json "0.2.6"]
                 [com.amazonaws/aws-lambda-java-core "1.0.0"]]
  :java-source-paths ["src/java"]
  :aot :all)
