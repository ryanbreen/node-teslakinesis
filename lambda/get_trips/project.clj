(defproject get-trips "0.1.0"
  :dependencies [[com.amazonaws/aws-lambda-java-core "1.0.0"]
                 [org.clojure/clojure "1.7.0"]
                 [org.clojure/data.json "0.2.6"]
                 [org.clojure/java.jdbc "0.4.1"]
                 [org.postgresql/postgresql "9.4-1204-jdbc41"]]
  :java-source-paths ["src/java"]
  :aot :all)
