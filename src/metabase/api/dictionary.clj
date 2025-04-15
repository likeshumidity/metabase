(ns metabase.api.dictionary
  "Endpoints relating to the translation of user-generated content"
  (:require
   [clojure.data.csv :as csv]
   [clojure.java.io :as io]
   [clojure.string :as str]
   [java-time.api :as t]
   [metabase.api.macros :as api.macros]
   [metabase.db.query :as mdb.query]
   [metabase.models.content-translation :as ct]
   [metabase.server.streaming-response :as sr]
   [metabase.util.date-2 :as u.date]
   [metabase.util.json :as json]
   [metabase.util.malli.schema :as ms]
   [toucan2.core :as t2])
  (:import
   (java.io BufferedWriter OutputStreamWriter)
   (java.nio.charset StandardCharsets)))

(defn- format-csv-to-stream [os display-names locales]
  (let [; If no locales were provided, we'll write all the rows out once with an empty locale
        locales (if (empty? locales) [""] locales)
        writer (BufferedWriter. (OutputStreamWriter. os StandardCharsets/UTF_8))
        headers ["Language" "String" "Translation"]]
    (try
      (csv/write-csv writer [headers])
      (doseq [locale locales]
        (doseq [display-name display-names]
          (csv/write-csv writer [[locale display-name ""]])))
      (.flush writer)
      (finally
        (.close writer)))))

(defn import-translations!
  "Import translations from CSV and insert or update rows in the content_translation table."
  [{:keys [_filename file]}]
  (with-open [reader (io/reader file)]
    (let [csv-data (rest (csv/read-csv reader))]
      (doseq [[locale msgid msgstr] csv-data]
        (let [trimmed-msgstr (str/trim msgstr)
              trimmed-msgid (str/trim msgid)]
          (when-not (str/blank? trimmed-msgstr)
            (t2/with-transaction [_tx]
              (mdb.query/update-or-insert! :model/ContentTranslation
                                           {:locale locale :msgid trimmed-msgid}
                                           (constantly {:locale locale
                                                        :msgid trimmed-msgid
                                                        :msgstr trimmed-msgstr})))))))))

(api.macros/defendpoint :post
  "/upload"
  "Upload a CSV of content translations"
  {:multipart true}
  [_route_params
   _query-params
   _body
   {:keys [multipart-params], :as _request} :- [:map
                                                [:multipart-params
                                                 [:map
                                                  ["file"
                                                   [:map
                                                    [:filename :string]
                                                    [:tempfile (ms/InstanceOfClass java.io.File)]]]]]]]
  (import-translations! {:filename      (get-in multipart-params ["file" :filename])
                         :file          (get-in multipart-params ["file" :tempfile])})
  (do
    {:status 200
     :headers {"Content-Type" "application/json"}
     :body (json/encode {:success true
                         :message "Import was successful"})}))

(api.macros/defendpoint :get "/"
  "Provides content translations stored in the content_translations table"
  [_route-params query-params _body]
  (let [locale (:locale query-params)]
    (if locale
      {:data (ct/get-translations locale)}
      {:data (ct/get-translations)})))

(set! *warn-on-reflection* true)
