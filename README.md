# 🌦️ India Weather Map - 3D Real-Time Geospatial & Big Data Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://react.dev)
[![Apache Kafka](https://img.shields.io/badge/Apache%20Kafka-7.4.0-231F20.svg?style=flat&logo=apachekafka&logoColor=white)](https://kafka.apache.org)
[![Apache Spark](https://img.shields.io/badge/Apache%20Spark-3.4.1-E25A1C.svg?style=flat&logo=apachespark&logoColor=white)](https://spark.apache.org)
[![Apache Cassandra](https://img.shields.io/badge/Cassandra-4.1-1287B1.svg?style=flat&logo=apachecassandra&logoColor=white)](https://cassandra.apache.org)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9+-199900.svg?style=flat&logo=leaflet&logoColor=white)](https://leafletjs.com)
[![MET Norway](https://img.shields.io/badge/Weather-MET%20Norway%202.0-005697.svg?style=flat)](https://api.met.no)
[![OpenStreetMap](https://img.shields.io/badge/Geocoding-OSM%20Nominatim-7EBC6F.svg?style=flat&logo=openstreetmap&logoColor=white)](https://nominatim.org)
[![Docker Compose](https://img.shields.io/badge/Docker%20Compose-v2+-2496ED.svg?style=flat&logo=docker&logoColor=white)](https://www.docker.com)

A distributed, end-to-end real-time Big Data and geospatial analytics platform. The system ingests and processes high-velocity meteorological streams using **Apache Kafka** and **Apache Spark Structured Streaming**, persists time-series observations in **Apache Cassandra**, and serves high-performance APIs via **FastAPI** to an interactive **3D WebGL weather map** and an interactive **Leaflet Weather Explorer**.

> ⚡ **Quick Run**: See [RUN_COMMANDS.md](RUN_COMMANDS.md) for copy-paste ready commands to launch the application with Docker or locally.

---

## 📑 Table of Contents

- [Weather Explorer & Real-Time Ingestion](#-weather-explorer--real-time-ingestion)
- [System Architecture](#-system-architecture)
- [Component Catalog](#-component-catalog)
- [Interactive Features](#-interactive-features)
- [Quick Start: Running with Docker Compose](#-quick-start-running-with-docker-compose)
- [Kafka Stream Ingestion & Topic Inspection](#-kafka-stream-ingestion--topic-inspection)
- [Cassandra Schema & Big Data Pipeline](#-cassandra-schema--big-data-pipeline)
- [API Endpoints Reference](#-api-endpoints-reference)
- [Provider Policies, Rate Limits & Attribution](#-provider-policies-rate-limits--attribution)
- [Troubleshooting & Gotchas](#-troubleshooting--gotchas)

---

## 🧭 Weather Explorer & Real-Time Ingestion

The **Weather Explorer** allows users to:
1. **Search Places Worldwide**: Type any city, district, town, or landmark using debounced **OpenStreetMap Nominatim Geocoding**.
2. **Interactive Map Selection**: Click anywhere on a responsive **Leaflet map** with OpenStreetMap tiles to instantly place a marker and reverse-geocode the location name.
3. **Browser Geolocation ("Use My Location")**: Detect current latitude and longitude using the browser Geolocation API (requiring user consent and HTTPS/localhost).
4. **Live Forecast Telemetry**: Fetch real-time weather forecasts directly from the **MET Norway Locationforecast 2.0 Compact API** (Temperature, Humidity, Wind speed/direction, Surface pressure, Cloud coverage, Precipitation, and WMO conditions).
5. **Apache Kafka Streaming Pipeline**: Start or stop live streaming ingestion into the Kafka `weather-events` topic with event deduplication and background task lifecycle management.
6. **Real Live Data (Redis Removed)**: Redis has been completely eliminated to ensure users receive live, unstored real-time weather telemetry with compliant in-memory RFC 7234 HTTP caching.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph DataIngestion ["1. Data Ingestion & Orchestration"]
        BACKEND_STREAMER["FastAPI Weather Stream Manager\n(app/services/weather_streamer.py)"] -->|Publishes normalized weather events| KAFKA["Apache Kafka Broker\nTopic: weather-events"]
        AF["Apache Airflow 2.7\n(dags/kafka_stream.py)"] -.->|Batch telemetry| KAFKA
        ZOOKEEPER["Zookeeper 7.4"] -.->|Cluster Coordination| KAFKA
    end

    subgraph StreamProcessing ["2. Real-Time Stream Processing"]
        KAFKA -->|Continuous Stream| SPARK["Spark Structured Streaming\n(spark_stream.py)"]
        SPARK_MASTER["Spark Master 3.4.1\n(:7077)"] --- SPARK
        SPARK_WORKER["Spark Worker\n(4 cores, 2GB RAM)"] --- SPARK
    end

    subgraph StorageLayer ["3. Big Data Storage & In-Memory Cache"]
        SPARK -->|Writes batch micro-partitions| CASSANDRA[("Apache Cassandra 4.1\nspark_streams.weather_data")]
        MEM_CACHE[("In-Memory RFC 7234 Cache\n(Redis Removed for Real Data)")]
    end

    subgraph ServingLayer ["4. Application API Layer"]
        BACKEND["FastAPI Backend (Python 3.11/3.13)\n(:8000)"]
        MET_NO["MET Norway Locationforecast 2.0\n(api.met.no)"] <-->|Compact weather forecasts| BACKEND
        NOMINATIM["OpenStreetMap Nominatim\n(nominatim.openstreetmap.org)"] <-->|Place Search & Reverse Geocode| BACKEND
        CASSANDRA <-->|Historical analytics| BACKEND
        MEM_CACHE <-->|Fast non-blocking lookup| BACKEND
    end

    subgraph PresentationLayer ["5. Geospatial Presentation Layer"]
        NGINX["Nginx Alpine Reverse Proxy\n(:3000 / :5173)"]
        REACT["React 18 + Vite + TypeScript\n(Zustand + React Query)"]
        LEAFLET["Leaflet JS Interactive Map\n(OpenStreetMap Canvas)"]
        MAPLIBRE["MapLibre GL JS v4\n(3D Extrusions)"]
        
        NGINX -->|Serves bundled static assets| REACT
        NGINX -->|Proxies /api/* to :8000| BACKEND
        REACT --- LEAFLET
        REACT --- MAPLIBRE
        USER(("End User Browser")) <-->|HTTP / WebGL| NGINX
    end

    classDef streaming fill:#e8f4f8,stroke:#0077b6,stroke-width:2px;
    classDef storage fill:#fbf0e4,stroke:#d97706,stroke-width:2px;
    classDef frontend fill:#edf7ed,stroke:#2e7d32,stroke-width:2px;
    class KAFKA,SPARK,AF,BACKEND_STREAMER streaming;
    class CASSANDRA,MEM_CACHE storage;
    class REACT,LEAFLET,MAPLIBRE,NGINX frontend;
```

---

## 🧩 Component Catalog

### 1. Presentation Layer (Frontend)
* **Framework**: React 18, TypeScript, Vite.
* **Weather Explorer**: Leaflet 1.9+ with OpenStreetMap tiles, debounced search suggestions, location reverse lookup, and Kafka start/stop controls.
* **3D Map Engine**: MapLibre GL JS v4 with hardware-accelerated 3D WebGL rendering.
* **State Management**: **Zustand** and **TanStack React Query**.
* **Styling**: Tailwind CSS with sleek dark glassmorphism (`backdrop-blur-md`).

### 2. Application Layer (Backend)
* **Framework**: FastAPI (Python 3.11/3.13) with asynchronous non-blocking endpoints.
* **Clients**:
  * `METNorwayClient`: Asynchronous HTTP client requesting MET Norway Locationforecast 2.0 Compact API with RFC 7234 `If-Modified-Since` handling.
  * `NominatimClient`: OpenStreetMap geocoding client with 1 req/sec rate limiting and reverse geocoding.
  * `WeatherStreamManager`: Singleton Kafka streaming ingestion producer with thread-safe start/stop controls.
  * `CassandraClient`: Resilient cluster connection pool that auto-bootstraps keyspace and table.
  * `CacheService`: Thread-safe in-memory TTL cache (Redis removed to guarantee live real data).

### 3. Big Data & Streaming Pipeline
* **Apache Kafka & Zookeeper (Confluent 7.4.0)**: Fault-tolerant distributed message broker queuing meteorological station messages on the `weather_data` topic.
* **Confluent Control Center**: Full cluster visibility, consumer lag tracking, and topic payload inspection UI.
* **Apache Spark 3.4.1 (Master, Worker, and Streaming Job)**:
  * Reads JSON telemetry from Kafka.
  * Applies schema transformations, casting, and timestamp conversions.
  * Streams micro-batches into Apache Cassandra via the `spark-cassandra-connector_2.12:3.4.1`.
* **Apache Cassandra 4.1**: Distributed columnar database partitioned by `(city, timestamp DESC)` for fast time-series analytical lookups.
* **Apache Airflow 2.7.0**: Orchestrates hourly simulated weather station telemetry generators (`dags/kafka_stream.py`) with PostgreSQL metadata storage.

---

## ✨ Interactive Features

| Feature | Description |
| :--- | :--- |
| **3D State Extrusions** | All 36 Indian states and union territories render as extruded 3D polygons where the height (up to 300km) is dynamically calculated from real-time temperature. |
| **Color Temperature Scale** | Gradient interpolation mapping: Deep Blue ($-10^\circ\text{C}$) $\to$ Cyan ($10^\circ\text{C}$) $\to$ Green ($20^\circ\text{C}$) $\to$ Amber ($30^\circ\text{C}$) $\to$ Red ($40^\circ\text{C}+$). |
| **3-Level Geographic Drill-down** | Navigate seamlessly from **National (India Overview)** $\to$ **State Boundaries** $\to$ **City/Coordinate Telemetry**. |
| **Live Weather Drawer** | Slide-out dashboard presenting current temperature, feels-like temperature, humidity, atmospheric pressure, wind direction, and precipitation. |
| **Forecast & Charts** | 48-hour hourly breakdowns, 7-day daily trends, and historical temperature charts powered by Recharts. |
| **Debounced Indian Geocoding** | Instant search bar with keyboard navigation (`↑`/`↓`/`Enter`) restricted to Indian localities (`country_code=IN`). |

---

## 🚀 Quick Start: Running with Docker Compose

### Prerequisites
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows / macOS / Linux) with Docker Compose v2+.
* At least **8 GB RAM** allocated to Docker Desktop (to run Spark, Kafka, Cassandra, Airflow, and Web containers concurrently).

### 1. Clone & Start All Services
```bash
# Clone the repository
git clone https://github.com/lucifer4330k/weatherpulse.git
cd weatherpulse

# Start all containers in detached mode
docker compose up -d
```

### 2. Verify Container Health
Wait 30–60 seconds for Cassandra and Kafka to pass initial health checks:
```bash
docker compose ps
```
You should see all containers listed with status `Up` or `Up (healthy)`:
* `weather-frontend`
* `weather-backend`
* `cassandra`
* `broker`
* `zookeeper`
* `spark-master`
* `spark-worker`
* `spark-streaming`
* `redis`
* `airflow-webserver`
* `airflow-scheduler`
* `postgres`

### 3. Open the Application
Open your web browser and navigate to:
* **[http://127.0.0.1:3000](http://127.0.0.1:3000)** *(Recommended)*
* Or **[http://localhost:5173](http://localhost:5173)**

> [!TIP]
> **Windows Note**: On some Windows machines, a system background process (`dllhost.exe`) listens on IPv6 loopback `[::1]:3000`. If `http://localhost:3000` appears blank or hangs, use **`http://127.0.0.1:3000`** or **`http://localhost:5173`** directly.

---

## 🌐 Web UIs & Port Catalog

| Service | Address | Credentials | Purpose |
| :--- | :--- | :--- | :--- |
| **Weather Map Frontend** | [http://127.0.0.1:3000](http://127.0.0.1:3000) or [:5173](http://localhost:5173) | *None* | Interactive 3D India Weather Map |
| **FastAPI Swagger Docs** | [http://localhost:8000/docs](http://localhost:8000/docs) | *None* | Interactive API documentation |
| **FastAPI ReDoc** | [http://localhost:8000/redoc](http://localhost:8000/redoc) | *None* | Alternative API spec viewer |
| **Airflow Webserver** | [http://localhost:8080](http://localhost:8080) | `admin` / `admin` | Pipeline orchestration & DAG triggers |
| **Kafka Control Center** | [http://localhost:9021](http://localhost:9021) | *None* | Kafka topic monitoring & consumer lag |
| **Spark Master Web UI** | [http://localhost:9090](http://localhost:9090) | *None* | Spark cluster status & active jobs |
| **Schema Registry** | [http://localhost:8081](http://localhost:8081) | *None* | Confluent Schema Registry |

---

## 💻 Standalone Local Development

If you wish to run individual components locally outside Docker containers:

### 1. Running Backend Locally
```bash
cd backend
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload --port 8000
```

### 2. Running Frontend Locally
```bash
cd frontend

# Install Node modules
npm install

# Run Vite development server
npm run dev
# Accessible at http://localhost:5173
```

### 3. Running Spark Streaming Locally
```bash
# Requires Apache Spark 3.4.1 installed locally and on PATH
spark-submit \
  --master local[*] \
  --packages org.apache.spark:spark-sql-kafka-0-10_2.12:3.4.1,com.datastax.spark:spark-cassandra-connector_2.12:3.4.1 \
  spark_stream.py
```

---

## 🗄️ Cassandra Schema & Big Data Pipeline

### Cassandra Keyspace & Table Definition
The keyspace `spark_streams` and table `weather_data` are automatically created on startup:
```sql
CREATE KEYSPACE IF NOT EXISTS spark_streams
WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};

CREATE TABLE IF NOT EXISTS spark_streams.weather_data (
    station_id text,
    timestamp timestamp,
    city text,
    state text,
    latitude double,
    longitude double,
    temperature double,
    humidity int,
    pressure double,
    wind_speed double,
    precipitation double,
    weather_code int,
    weather_description text,
    PRIMARY KEY (city, timestamp)
) WITH CLUSTERING ORDER BY (timestamp DESC);
```

### Querying Cassandra via CLI
```bash
# Connect to CQLSH inside the Cassandra container
docker exec -it cassandra cqlsh -u cassandra -p cassandra

# Inspect record count and sample data
SELECT COUNT(*) FROM spark_streams.weather_data;
SELECT city, timestamp, temperature, humidity, wind_speed FROM spark_streams.weather_data LIMIT 10;
```

---

## 🔌 API Endpoints Reference

All endpoints support both `/` and `/api/` route prefixes:

### Weather Explorer & Geocoding Endpoints
* `GET /api/locations/search?q={query}&limit=5`: Search for cities, towns, and places worldwide via OpenStreetMap Nominatim with debouncing and in-memory caching.
* `GET /api/locations/reverse?lat={lat}&lon={lon}`: Reverse geocodes coordinates to a human-readable location label.

### MET Norway Weather Telemetry
* `GET /api/weather/forecast?lat={lat}&lon={lon}`: Retrieves normalized real weather forecast directly from **MET Norway Locationforecast 2.0 (Compact)** with RFC 7234 HTTP in-memory caching.
* `GET /api/weather/health`: Operational status of weather provider integrations without making excessive upstream calls.
* `GET /api/weather/current?lat={lat}&lon={lon}`: Live temperature, humidity, wind, and conditions.
* `GET /api/weather/dashboard?lat={lat}&lon={lon}&name={name}`: Full dashboard bundle.
* `GET /api/weather/historical?lat={lat}&lon={lon}&days=30`: 30-day weather trends.
* `GET /api/weather/alerts?lat={lat}&lon={lon}`: Extreme condition warnings.

### Kafka Streaming Pipeline Controls
* `POST /api/weather/stream/start`: Starts the background streaming ingestion worker publishing real MET Norway forecast events to Kafka topic `weather-events`. Accepts optional JSON body: `{"location": {"name": "Bengaluru", "latitude": 12.97, "longitude": 77.59}, "fetch_interval_seconds": 300}`.
* `POST /api/weather/stream/stop`: Cleanly terminates the background ingestion task and flushes/closes Kafka producers without duplicate tasks.
* `GET /api/weather/stream/status`: Returns whether ingestion is running, configured locations, last fetch timestamp, last publish timestamp, published event count, and error information.

### Health Probes
* `GET /api/health`: Full health check querying Cassandra, in-memory cache, and weather providers (Redis removed).
* `GET /api/ready`: Kubernetes readiness probe.
* `GET /api/live`: Kubernetes liveness probe.

### India Meteorological Summaries
* `GET /api/india/overview`: State-by-state temperature map and national averages.
* `GET /api/india/state/{state_code}`: In-depth metrics for a specific state code (e.g. `MH`, `DL`, `KA`).
* `GET /api/india/state/{state_code}/districts`: Regional district centers.

### Cassandra Big Data Queries
* `GET /api/cassandra/historical?city={city}&days=30`: Analytical time-series directly from Cassandra.
* `GET /api/cassandra/latest?city={city}`: Most recent stream entry.
* `GET /api/cassandra/cities`: List of cities populated in the Cassandra keyspace.

---

## 📜 Provider Policies, Rate Limits & Attribution

### 1. MET Norway Weather API
* **Official Documentation**: [MET Norway Locationforecast 2.0 Documentation](https://api.met.no/weatherapi/locationforecast/2.0/documentation)
* **Usage Policy**: Requires a custom `User-Agent` identifying the application and valid contact. Generic or placeholder user-agents (`example.com`) are blocked with HTTP 403.
* **Caching & Polling**: Complies with RFC 7234 HTTP headers (`Expires`, `Last-Modified`, and `If-Modified-Since`). Endpoints return HTTP 304 Not Modified when data has not changed. Do not poll faster than the update cycle (default 300s).

### 2. OpenStreetMap Nominatim
* **Official Documentation**: [Nominatim Search API Documentation](https://nominatim.org/release-docs/latest/api/Search/)
* **Usage Policy**: Maximum 1 request per second. Search input is debounced in the frontend and throttled in the backend.
* **Attribution**: "Data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors, ODbL 1.0".

### 3. Leaflet & OpenStreetMap Tiles
* **Official Documentation**: [Leaflet Documentation](https://leafletjs.com/)
* **Tile Usage Policy**: Tile layer uses standard OSM tiles with attribution `&copy; OpenStreetMap contributors`. Configurable tile URL in `LeafletMap.tsx`.

---

## 🧪 Testing and Verification Guide

### Automated Backend Test Suite
Run unit tests with mocks and live integration tests:
```bash
cd backend
.\.venv\Scripts\pytest -v
```

### Testing City Search and Map Selection
1. Open [http://localhost:5173](http://localhost:5173) and click **Weather Explorer** in the top navigation bar.
2. In the search box, type "Bengaluru", "Mumbai", or "London". Observe debounced suggestions from Nominatim.
3. Click a result: the Leaflet map centers, marker moves to coordinates, and MET Norway forecast cards render.
4. Click anywhere on the Leaflet map: marker moves to the clicked coordinates, reverse geocoding names the location, and fresh forecast data loads.

### Testing Current-Location Detection
1. Click **Use My Location**.
2. Allow browser permission when prompted.
3. The map centers on your current coordinates, displays the location name, and retrieves real forecast telemetry.

### Testing Kafka Streaming Ingestion
1. In the Weather Explorer panel, click **Start Kafka Stream**.
2. The pipeline status badge changes to `INGESTING LIVE` with topic `weather-events`.
3. In a separate terminal, inspect live Kafka records:
```bash
docker compose exec broker kafka-console-consumer --bootstrap-server localhost:9092 --topic weather-events --from-beginning
```
4. Click **Stop Ingestion** to stop the worker cleanly. Status switches to `IDLE` with no duplicate processes.

---

## 📁 Repository Structure

```
kafka-spark-cassandra/
├── frontend/                    
│   ├── src/
│   │   ├── components/          
│   │   ├── hooks/               
│   │   ├── services/            
│   │   ├── store/               
│   │   └── types/               
│   ├── nginx.conf               
│   ├── Dockerfile               
│   └── README.md              
│
├── backend/                    
│   ├── app/
│   │   ├── routers/             
│   │   ├── services/         
│   │   ├── models/            
│   │   └── main.py              
│   ├── Dockerfile              
│   ├── requirements.txt        
│   └── README.md                
│
├── dags/                        
│   ├── kafka_stream.py         
│   └── README.md                
│
├── script/
│   └── entrypoint.sh           
├── spark_stream.py              
├── docker-compose.yml          
├── RUN_COMMANDS.md              
└── README.md
```

---

## 🛠️ Troubleshooting & Gotchas

### 1. Blank Screen or Connection Error on `localhost:3000`
* **Root Cause**: Windows system host processes (`dllhost.exe`) frequently occupy `[::1]:3000` on Windows 10/11, intercepting IPv6 browser traffic.
* **Solution**: Navigate to **[http://127.0.0.1:3000](http://127.0.0.1:3000)** (direct IPv4 loopback) or **[http://localhost:5173](http://localhost:5173)**.

### 2. MapLibre 3D Styles Not Rendering
* **Root Cause**: Invalid Mapbox-specific layers (like `sky`) or missing properties in GeoJSON layers can cause MapLibre's style validator to reject the style sheet.
* **Solution**: Handled automatically in `mapUtils.ts` by using the standard raster ESRI Dark Canvas basemap and wrapping property lookups in `['coalesce', ['get', 'property'], default]`.

### 3. Cassandra Connection Refusal on First Boot
* **Root Cause**: Cassandra 4.1 requires 30–45 seconds to initialize storage engines and bind to port `9042`.
* **Solution**: The `docker-compose.yml` specifies `healthcheck: test: ["cqlsh", "-e", "describe keyspaces"]` and `backend` depends on `cassandra: condition: service_healthy`. The backend automatically retries with exponential backoff.

### 4. Spark Worker Resource Allocation
* **Root Cause**: Spark Structured Streaming with Kafka and Cassandra connectors requires at least 2 cores and 1.5 GB memory to execute streaming micro-batches.
* **Solution**: The `spark-worker` service is pre-configured with `SPARK_WORKER_CORES: 4` and `SPARK_WORKER_MEMORY: 2g`.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
