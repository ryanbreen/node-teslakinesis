(ns trips
  (:gen-class
   :methods [^:static [handler [String] String]]))

(defn -get [s]
  (str "Hello " s "!"))
