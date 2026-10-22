# ⚡ Weatherpulse: Quick-Run Command Guide

This guide contains copy-paste ready commands to run **Weatherpulse** in different modes (Docker Lightweight, Full Big Data Pipeline, or Local Standalone without Docker).

---

## 🚀 Option 1: Run with Docker (Recommended)

### 🔹 Mode A: Lightweight Web Mode (< 1 GB RAM, Instant Startup)
Runs the **FastAPI Backend**, **Redis Cache**, and **React 3D Frontend** with real live Open-Meteo weather data. Perfect for local development, demos, and testing.

```bash
docker compose up -d
```

- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **Backend API & Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Backend Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

### 🔹 Mode B: Full Big Data Pipeline Mode (~14 Containers)
Boots the entire enterprise distributed stack: **Airflow**, **Apache Kafka**, **Apache Spark Streaming**, **Apache Cassandra**, **Redis**, **FastAPI Backend**, and **React Frontend**.

```bash
docker compose --profile full up -d
```

- **Airflow Web UI**: [http://localhost:8080](http://localhost:8080) (Default login: `admin` / `admin`)
- **Confluent Kafka Control Center**: [http://localhost:9021](http://localhost:9021)
- **Spark Master UI**: [http://localhost:9090](http://localhost:9090)
- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **FastAPI Backend**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### 🛑 Stop Docker Containers

To stop the running application:
```bash
docker compose down
```

To stop and remove stored volumes (cleans Cassandra and Redis state):
```bash
docker compose down -v
```

---

## 💻 Option 2: Run Locally (Without Docker)

If you prefer to run the Backend and Frontend directly on your machine using Python and Node.js:

### Step 1: Start the Backend (Terminal 1)

```bash
cd backend
python -m venv venv
```

**Activate Virtual Environment**:
- **Windows (PowerShell)**:
  ```powershell
  .\venv\Scripts\Activate.ps1
  ```
- **Windows (Command Prompt)**:
  ```cmd
  venv\Scripts\activate.bat
  ```
- **Linux / macOS**:
  ```bash
  source venv/bin/activate
  ```

**Install & Run**:
```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
*Backend will be running at [http://localhost:8000](http://localhost:8000).*

---

### Step 2: Start the Frontend (Terminal 2)

```bash
cd frontend
npm install
npm run dev
```
*Frontend will be running at [http://localhost:5173](http://localhost:5173).*

---

### Step 3 (Optional): Run Kafka Streaming Data Producer (Terminal 3)

To start streaming live Indian meteorological observations into Kafka:

```bash
cd dags
python kafka_stream.py
```

---

## 🔍 Useful Health Check Commands

Check status of running Docker services:
```bash
docker compose ps
```

Check live logs of backend:
```bash
docker compose logs -f backend
```

Check live logs of frontend:
```bash
docker compose logs -f frontend
```

Test Backend API from terminal:
```bash
curl http://localhost:8000/health
```

Test India Weather Overview API:
```bash
curl http://localhost:8000/api/india/overview
```
