(defproject get-trips "0.1.0"
  :dependencies [[org.clojure/clojure "1.7.0"]
                 [org.clojure/data.json "0.2.6"]
                 [org.clojure/java.jdbc "0.4.1"]
                 [org.postgresql/postgresql "9.4-1204-jdbc41"]]
  :java-source-paths ["src/java"]
  :aot :all)
