# ⏱️ Data Pipeline Orchestration - Apache Airflow DAGs

This directory contains the Apache Airflow DAG definitions for automated weather data generation and streaming ingestion into Apache Kafka.

---

## 📋 DAG Overview

### `weather_stream_pipeline` (`dags/kafka_stream.py`)
* **Schedule Interval**: `@hourly`
* **Purpose**: Simulates high-velocity meteorological station telemetry across cities and streams records directly into the Kafka topic `weather_data`.
* **Throughput**: ~100 records per second for continuous ingestion windows (default: 540 seconds per task run).
* **Kafka Topic**: `weather_data`

---

## 📡 Message Payload Schema

Each JSON payload published to Kafka represents a single weather station recording:

```json
{
  "station_id": "8f3070d6-11f8-450a-939e-e28e14cb7eb2",
  "timestamp": "2026-10-12T00:15:00Z",
  "location": {
    "city": "Mumbai",
    "country": "India",
    "latitude": 19.0760,
    "longitude": 72.8777
  },
  "metrics": {
    "temperature": 28.4,
    "humidity": 78.0,
    "pressure": 1011.2,
    "wind_speed": 12.3,
    "wind_direction": "SW"
  }
}
```

---

## 🚀 How to Manage via Airflow UI

1. Open the Airflow Webserver in your browser:
   * **URL**: [http://localhost:8080](http://localhost:8080)
   * **Username**: `admin`
   * **Password**: `admin`
2. Locate the DAG named **`user_automation`** (or `weather_stream_pipeline`).
3. Toggle the DAG switch to **Active / Unpaused** to trigger automated streaming, or click **Trigger DAG** (play icon) to launch an immediate run.
4. View real-time log output and stream metrics under the **Graph** or **Grid** view tabs.
