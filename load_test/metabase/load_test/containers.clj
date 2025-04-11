(ns metabase.load-test.containers
  (:require
   [clj-test-containers.core :as tc]
   [clojure.java.io :as io]
   [clojure.string :as str]
   [integrant.core :as ig]
   [metabase.config :as config]
   [metabase.util.log :as log]
   [metabase.util.yaml :as yaml])
  (:import
   (com.github.dockerjava.api.command CreateNetworkCmd)
   (java.io File)
   (java.nio.file
    Paths)
   (org.testcontainers DockerClientFactory)
   (org.testcontainers.containers
    Container
    GenericContainer
    Network)
   (org.testcontainers.images.builder
    ImageFromDockerfile)))

(set! *warn-on-reflection* true)

(def ^:dynamic *started-instances* nil)

(defn start!
  "Starts the underlying testcontainer instance and adds new values to the
  response map, e.g. :id and :first-mapped-port"
  [{:keys [^GenericContainer container
           log-to
           exposed-ports] :as container-config}]
  (.start container)
  (let [map-port (fn map-port
                   [port]
                   [port (.getMappedPort container port)])
        mapped-ports (into {} (map map-port) exposed-ports)
        container-id ^String (.getContainerId container)
        image-name ^String (.getDockerImageName container)
        logger (tc/log log-to container)]
    (swap! *started-instances* conj {:type :container :id container-id})
    (-> container-config
        (merge {:id           container-id
                :mapped-ports mapped-ports
                :image-name   image-name} logger)
        (dissoc :log-to))))

(defn remove-network! [instance]
  (-> (DockerClientFactory/instance)
      (.client)
      (.removeNetworkCmd (:id instance))
      (.exec))
  instance)

(defn create-network
  "Creates a network. The optional map accepts config values for enabling ipv6
  and setting the driver"
  ([^String name]
   (create-network name {}))
  ([^String name {:keys [ipv6 driver]}]
   (let [builder (doto (Network/builder)
                   (.createNetworkCmdModifier (fn [^CreateNetworkCmd cmd]
                                                (.withName cmd name))))]
     (when ipv6
       (.enableIpv6 builder true))

     (when driver
       (.driver builder driver))

     (let [network (.build builder)
           network-id (.getId network)]
       (swap! *started-instances* conj {:type :network :id network-id})
       {:network network
        :id      network-id
        :ipv6    (.getEnableIpv6 network)
        :driver  (.getDriver network)}))))

(defn perform-cleanup!
  "Stops and removes all container instances which were created in the active JVM or REPL session"
  []
  (doseq [instance @*started-instances*]
    (try
      (swap! *started-instances* disj (case (:type instance)
                                        :container (#'tc/stop-and-remove-container! instance)
                                        :network (remove-network! instance)))
      (catch com.github.dockerjava.api.exception.NotFoundException _)
      (catch Throwable e
        (log/error e)))))

(defn create-from-docker-file
  "Creates a testcontainer from a provided Dockerfile"
  [{:keys [docker-file build-args] :as options}]
  (->>  (doto  (ImageFromDockerfile.)
          (.withDockerfile (Paths/get "." (into-array [docker-file])))
          (.withBuildArgs build-args))
        (GenericContainer.)
        (assoc options :container)
        tc/init))

(defmethod ig/init-key :infra/network [_ {:keys [name]
                                          :or   {name "test.metabase.dev"}}]
  (create-network name))

(derive :db/postgres :infra/container)
(derive :web/metabase :infra/container)
(derive :web/nginx :infra/container)

(defn- get-db-type
  [{:keys [container-info]}]
  (condp #(str/starts-with? %2 %1) (.getDockerImageName ^Container (:container container-info))
    "postgres" "postgres"))

(defmethod ig/init-key :db/postgres [_ {:keys [network version port user password dbname hostname]
                                        :or {version  "14"
                                             port     "5432"
                                             user     "metabase"
                                             password "password"
                                             dbname   "metabase"
                                             hostname "postgres"}}]
  {:db-config {:db-type  :postgres
               :port     port
               :user     user
               :password password
               :dbname   dbname
               :host     hostname}
   :container-info (-> (tc/create {:image-name      (str "postgres:" version)
                                   :network         network
                                   :network-aliases [hostname]
                                   :exposed-ports   [(Integer/parseInt port)]
                                   :env-vars        {"POSTGRES_USER"     user
                                                     "POSTGRES_DB"       dbname
                                                     "POSTGRES_PASSWORD" password
                                                     "POSTGRES_PORT"     port}})
                       start!)})

(defmethod ig/init-key :web/metabase [_ {:keys [db port metrics-port token network instance-count virtual-host]}]
  (let [container-info (for [n (range instance-count)]
                         (create-from-docker-file {:env-vars      (cond-> {"VIRTUAL_HOST"               virtual-host
                                                                           "MB_PREMIUM_EMBEDDING_TOKEN" token
                                                                           "MB_DB_TYPE"                 (get-db-type db)
                                                                           "MB_DB_HOST"                 (-> db :db-config :host)
                                                                           "MB_DB_PORT"                 (-> db :db-config :port)
                                                                           "MB_DB_DBNAME"               (-> db :db-config :dbname)
                                                                           "MB_DB_USER"                 (-> db :db-config :user)
                                                                           "MB_DB_PASS"                 (-> db :db-config :password)}
                                                                    port         (assoc "MB_PORT" port)
                                                                    metrics-port (assoc "MB_PROMETHEUS_SERVER_PORT" metrics-port))
                                                   :build-args    {"MB_EDITION" "ee"}
                                                   :exposed-ports (cond-> [(or port 3000)]
                                                                    metrics-port metrics-port)
                                                   :network       network
                                                   :network-alias [(str "metabase-" n)]
                                                   :docker-file   "Dockerfile.load-test"
                                                   :wait-for      {:wait-strategy   :http
                                                                   :path            "/api/health"
                                                                   :port            (or port 3000)
                                                                   :method          "GET"
                                                                   :status-codes    [200]
                                                                   :tls             false
                                                                   :read-timout     5
                                                                   :startup-timeout 30}}))]
    (doseq [container container-info]
      (start! container))
    {:container-info container-info :virtual-host virtual-host}))

(defmethod ig/init-key :web/nginx [_ {:keys [version network]
                                      :or {version "1.7"}}]
  {:container-info (-> (tc/create {:image-name    (str "nginxproxy/nginx-proxy:" version)
                                   :network       network
                                   :exposed-ports [80]})
                       (tc/bind-filesystem! {:host-path      "/var/run/docker.sock"
                                             :container-path "/tmp/docker.sock"
                                             :mode           :read-only})
                       start!)})

(defmethod ig/halt-key! :infra/container [_ {:keys [container-info]}]
  (cond
    (map? container-info) (tc/stop! container-info)
    (seq? container-info) (doseq [container container-info]
                            (tc/stop! container))))

(def config-with-postgres-two-metabase
  {:infra/network {}
   :db/postgres  {:network (ig/ref :infra/network)}
   :web/metabase {:network        (ig/ref :infra/network)
                  :db             (ig/ref :db/postgres)
                  :instance-count 2
                  :virtual-host   "test.metabase.dev"
                  :token          (config/config-str :mb-premium-embedding-token)}
   :web/nginx    {:network (ig/ref :infra/network)}})

(def ^:dynamic *container-system* nil)

(defn do-with-containers!
  [container-map thunk]
  (binding [*started-instances* (atom #{})]
    (try
      (let [system (ig/init container-map)]
        (try
          (binding [*container-system* system]
            (thunk))
          (finally
            (ig/halt! system))))
      (finally
        (perform-cleanup!)))))

(defmacro with-containers!
  [container-map & body]
  `(do-with-containers! ~container-map (fn [] ~@body)))

(comment
  (metabase.load-test.containers/do-with-containers! metabase.load-test.containers/config-with-postgres-two-metabase #(Thread/sleep 50000)))
