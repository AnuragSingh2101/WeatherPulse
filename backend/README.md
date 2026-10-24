# 🌦️ Backend Service - Real-Time Weather & Analytics API

FastAPI backend service powering the **India Weather Map** visualization platform. It provides high-throughput REST endpoints for current weather conditions, multi-day forecasts, Indian geocoding, national weather aggregations, and historical analytics querying Apache Cassandra.

---

## 🏗️ Architecture & Component Design

The backend is structured into clear layers following clean architecture principles:

```
backend/
├── app/
│   ├── main.py              # Application factory, lifespan context, CORS, router mounting
│   ├── config.py            # Pydantic BaseSettings loading from environment variables
│   ├── models/              # Pydantic v2 schemas and data validation
│   │   ├── weather.py       # Weather data, forecast, trends, and alert models
│   │   └── location.py      # Coordinates, bounding boxes, state & district models
│   ├── routers/             # FastAPI APIRouter endpoints
│   │   ├── health.py        # /health, /ready, /live service health probes
│   │   ├── locations.py     # /locations/search & /reverse OpenStreetMap Nominatim
│   │   ├── geocode.py       # Legacy Open-Meteo geocoding
│   │   ├── weather.py       # MET Norway forecast, health, and Kafka stream controls
│   │   ├── india.py         # National overview & state-level meteorological summaries
│   │   └── cassandra.py     # Big data historical queries directly from Cassandra
│   └── services/            # Core external service clients & data managers
│       ├── met_norway.py    # MET Norway Locationforecast 2.0 compact client with RFC 7234 cache
│       ├── nominatim.py     # OpenStreetMap Nominatim client with 1 req/sec rate limit
│       ├── weather_streamer.py # Background Kafka ingestion producer with lifecycle management
│       ├── cassandra_client.py # Cassandra Cluster session manager
│       └── cache.py         # In-memory TTL cache (Redis removed for real-data ingestion)
├── Dockerfile               # Multi-stage optimized Python container
└── requirements.txt         # Production dependencies
```

---

## ⚙️ Configuration & Environment Variables

The backend uses `pydantic-settings` to parse configuration from `.env` or system environment variables:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `METNO_BASE_URL` | `https://api.met.no/weatherapi/locationforecast/2.0/compact` | MET Norway Compact endpoint |
| `METNO_USER_AGENT` | `WeatherPulse/1.0 (...)` | Required identifying User-Agent with valid contact |
| `NOMINATIM_BASE_URL` | `https://nominatim.openstreetmap.org/search` | OSM Nominatim place search endpoint |
| `NOMINATIM_USER_AGENT` | `WeatherPulse/1.0 (...)` | Required OSM Nominatim User-Agent |
| `KAFKA_BOOTSTRAP_SERVERS` | `localhost:9092` | Kafka broker bootstrap servers |
| `KAFKA_TOPIC_WEATHER` | `weather-events` | Kafka topic for weather forecast events |
| `WEATHER_FETCH_INTERVAL_SECONDS` | `300` | Ingestion polling interval (default 5 min) |
| `CASSANDRA_HOSTS` | `cassandra` (or `localhost`) | Comma-separated Cassandra node addresses |
| `CASSANDRA_PORT` | `9042` | Cassandra native protocol CQL port |
| `CASSANDRA_KEYSPACE` | `spark_streams` | Cassandra keyspace containing weather data |
| `CORS_ORIGINS` | `http://localhost:3000,...` | Allowed CORS origins for frontend access |

---

## 🚀 How to Run

### Option 1: Docker Compose (Part of the Full Stack)
The backend runs automatically when starting Docker Compose from the root folder:
```bash
docker compose up -d backend
```
Access points:
* **Base URL**: `http://localhost:8000`
* **Interactive OpenAPI Docs**: `http://localhost:8000/docs`
* **ReDoc Documentation**: `http://localhost:8000/redoc`

### Option 2: Local Python Environment

1. **Create and activate a virtual environment**:
   ```bash
   cd backend
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On Linux/macOS:
   source venv/bin/activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   # Ensure CASSANDRA_HOSTS=localhost and REDIS_URL=redis://localhost:6379/0 if testing with local ports
   ```

4. **Launch development server**:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

---

## 🔌 API Reference & Endpoints

All endpoints are mounted under both the root `/` and `/api` prefix for seamless reverse-proxying.

### 1. Health & Diagnostics
* `GET /health` or `GET /api/health`
  * Checks connectivity across Cassandra, Redis, and Open-Meteo.
  * **Response**:
    ```json
    {
      "status": "healthy",
      "timestamp": "2026-10-12T00:15:00.000000",
      "services": {
        "open_meteo": "healthy",
        "cassandra": "healthy",
        "cache": "healthy"
      }
    }
    ```

### 2. Weather & Forecast
* `GET /api/weather/current?lat=28.6139&lon=77.2090`
  * Returns real-time temperature, humidity, wind, pressure, precipitation, and conditions.
* `GET /api/weather/forecast?lat=28.6139&lon=77.2090&hours=48&days=7`
  * Returns hourly forecast (up to 48 hours) and daily forecast summaries (up to 7 days).
* `GET /api/weather/dashboard?lat=28.6139&lon=77.2090&name=Delhi`
  * Comprehensive bundle containing current conditions, forecasts, alerts, and historical data in a single network round-trip.

### 3. Geocoding
* `GET /api/geocode?q=Mumbai&limit=5`
  * Searches locations matching query restricted to India (`country_code=IN`).
* `GET /api/geocode/reverse?lat=19.0760&lon=72.8777`
  * Reverse geocodes coordinates to administrative locality name and state.

### 4. India National Overview
* `GET /api/india/overview`
  * Returns national averages and current temperature readings for all 36 Indian states and union territories.
* `GET /api/india/state/{state_code}`
  * Returns detailed state metrics and bounding box coordinates for a state (e.g. `MH`, `DL`, `KA`).

### 5. Cassandra Big Data Ingestion Analytics
* `GET /api/cassandra/historical?city=Mumbai&days=30`
  * Directly queries the `spark_streams.weather_data` table populated by the Spark Streaming pipeline.
* `GET /api/cassandra/cities`
  * Lists all distinct weather stations / cities recorded in Cassandra.

---

## 🗄️ Cassandra Integration Details

* **Auto-Bootstrapping**: On application startup (`app/services/cassandra_client.py`), the backend automatically creates keyspace `spark_streams` with `SimpleStrategy` replication (factor 1) and creates the `weather_data` table if missing.
* **Schema Definition**:
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
