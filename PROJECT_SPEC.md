# India Weather Map - Interactive 3D Visualization

## Project Overview
Build an interactive 3D weather visualization map for India using MapLibre GL JS, React, and FastAPI. The map displays real-time and historical weather data from the existing Kafka-Spark-Cassandra pipeline, integrated with Open-Meteo for live weather data.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)                  │
│  ┌──────────────────┐  ┌────────────────────────────────────┐  │
│  │  MapLibre GL JS  │  │     Weather Dashboard Panel        │  │
│  │  - 3D Globe      │  │  - Current Conditions              │  │
│  │  - State/District│  │  - Hourly/Daily Forecast           │  │
│  │    Polygons      │  │  - Historical Trends (Charts)      │  │
│  │  - Weather       │  │  - Alerts                          │  │
│  │    Markers       │  │  - Data Freshness                  │  │
│  │  - Click Events  │  │  - Loading States                  │  │
│  └────────┬─────────┘  └──────────────────┬─────────────────┘  │
│           │                                │                   │
│           └────────────────┬───────────────┘                   │
│                            ▼                                   │
│                    ┌───────────────┐                            │
│                    │  Search Bar   │                            │
│                    │  (Geocoding)  │                            │
│                    └───────┬───────┘                            │
└────────────────────────────┼────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       BACKEND (FastAPI)                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│  │ Open-Meteo   │ │  Cassandra   │ │   Cache      │             │
│  │   Client     │ │   Client     │ │  (Redis/     │             │
│  │              │ │              │ │   In-memory) │             │
│  └──────────────┘ └──────────────┘ └──────────────┘             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXISTING DATA PIPELINE                       │
│  Kafka → Spark Streaming → Cassandra → Airflow Orchestration    │
│  (Generates simulated weather data for Indian cities)           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technical Stack

| Layer | Technology |
|-------|------------|
| Frontend Framework | React 18 + Vite + TypeScript |
| Map Library | MapLibre GL JS v4+ |
| Styling | Tailwind CSS |
| Charts | Recharts or Chart.js |
| State Management | React Query (TanStack Query) + Zustand |
| Backend API | FastAPI (Python 3.10+) |
| Weather API | Open-Meteo (free, no API key needed) |
| Geocoding | Open-Meteo Geocoding API |
| Historical Data | Cassandra (existing pipeline) |
| Cache | In-memory TTL cache (upgrade to Redis later) |
| Map Data | GeoJSON (India states/districts) |

---

## Core Features

### 1. Three-Level Geographic Navigation
- **Level 1 - India Overview**: Nationwide weather summary, colored by temperature/rainfall/alert level
- **Level 2 - State/District**: Regional conditions, district-level polygons clickable
- **Level 3 - City/Point**: Detailed weather dashboard for selected coordinates

### 2. Map Interactions
- Globe view with 3D extrusion for state boundaries
- Rotate, zoom, pan
- Click on polygon → select state/district
- Click on marker → select city
- Click anywhere → reverse geocode to nearest location
- Hover tooltips with quick info

### 3. Weather Dashboard Panel (Right Side)
| Section | Data |
|---------|------|
| Current Conditions | Temp, Feels-like, Humidity, Wind, Precipitation, Pressure |
| Forecast | Hourly (48h) + Daily (7d) |
| Historical Trends | Temperature & Rainfall charts (30d/90d/1y) |
| Alerts | Threshold-based alerts with severity |
| Data Freshness | Source (Open-Meteo/Cassandra), Last updated timestamp |

### 4. Search & Discovery
- Search bar with debounced Open-Meteo geocoding
- Results limited to India
- Click result → fly to location + open dashboard

### 5. Visual Design
- Dark theme (polished, professional)
- Glowing weather markers
- Color-coded polygons (temperature gradient, rainfall, alert levels)
- 3D extrusion for state boundaries
- Smooth animations/transitions
- Loading states for all async operations
- Honest "data unavailable" messaging

---

## Data Sources & Handling

### Open-Meteo (Primary for Real-time)
- **Current Weather**: `/v1/forecast` with `current_weather=true`
- **Forecast**: Hourly (temperature_2m, relative_humidity_2m, precipitation, windspeed_10m, etc.) + Daily (temperature_2m_max, temperature_2m_min, precipitation_sum, etc.)
- **Historical**: `/v1/forecast` with `past_days=30` or `/v1/climate` for longer history
- **Geocoding**: `/v1/search?name={query}&count=10&language=en&format=json`

### Cassandra (Historical/Analytics from Pipeline)
- Table: `spark_streams.weather_data`
- Fields: station_id, timestamp, city, country, latitude, longitude, temperature, humidity, pressure, wind_speed, wind_direction, precipitation, weather_condition
- Use for: Historical trends, regional summaries, Spark-computed analytics

### Data Freshness Strategy
- Cache Open-Meteo responses (TTL: 10 min for current, 1 hour for forecast)
- Show "Last updated: X minutes ago" in dashboard
- Distinguish: "Model estimate (Open-Meteo)" vs "Observed (Cassandra station)"

---

## API Endpoints (FastAPI)

```
GET  /api/health
GET  /api/geocode?q={query}&limit=10
GET  /api/weather/current?lat={lat}&lon={lon}
GET  /api/weather/forecast?lat={lat}&lon={lon}&hours=48&days=7
GET  /api/weather/historical?lat={lat}&lon={lon}&days=30
GET  /api/weather/alerts?lat={lat}&lon={lon}
GET  /api/india/overview          # National summary for map coloring
GET  /api/india/states            # All states with current weather
GET  /api/india/state/{state_code} # Districts in state with weather
GET  /api/cassandra/historical?city={city}&days=30
```

---

## Map Data Requirements

### India GeoJSON
- **States**: 28 states + 8 UTs = 36 polygons
- **Districts**: ~766 districts (optional, can load on demand)
- Properties needed: `name`, `state_code`, `type` (state/district)

### Sources for GeoJSON
- https://github.com/geohacker/india (states, districts)
- https://github.com/datameet/maps (various admin levels)
- Can simplify with mapshaper for performance

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] React + Vite + TypeScript setup
- [ ] MapLibre GL JS integration with dark style
- [ ] India states GeoJSON loading
- [ ] Basic map: globe view, click handling, zoom to India
- [ ] FastAPI skeleton with health check

### Phase 2: Core Map Features (Week 1-2)
- [ ] State polygons with extrusion + color coding
- [ ] Click state → zoom to state, show districts
- [ ] Click district → zoom to district
- [ ] Click anywhere → reverse geocode + dashboard
- [ ] Search bar with geocoding

### Phase 3: Weather Dashboard (Week 2)
- [ ] Current conditions panel
- [ ] Forecast panel (hourly + daily)
- [ ] Historical charts (Recharts)
- [ ] Alerts panel
- [ ] Data freshness indicator
- [ ] Loading/error states

### Phase 4: Backend Integration (Week 2-3)
- [ ] Open-Meteo client with caching
- [ ] Cassandra client for historical data
- [ ] All API endpoints implemented
- [ ] Connect frontend to backend

### Phase 5: Polish & Advanced (Week 3)
- [ ] Weather markers (glowing, animated)
- [ ] 3D terrain/extrusion enhancements
- [ ] Alert visualization on map
- [ ] Performance optimization
- [ ] Mobile responsive
- [ ] Accessibility improvements

---

## File Structure

```
kafka-spark-cassandra/
├── frontend/                    # React + Vite app
│   ├── src/
│   │   ├── components/
│   │   │   ├── Map/
│   │   │   │   ├── MapContainer.tsx
│   │   │   │   ├── MapLayers.tsx
│   │   │   │   ├── WeatherMarkers.tsx
│   │   │   │   └── useMapEvents.ts
│   │   │   ├── Dashboard/
│   │   │   │   ├── WeatherDashboard.tsx
│   │   │   │   ├── CurrentConditions.tsx
│   │   │   │   ├── Forecast.tsx
│   │   │   │   ├── HistoricalCharts.tsx
│   │   │   │   ├── Alerts.tsx
│   │   │   │   └── DataFreshness.tsx
│   │   │   ├── Search/
│   │   │   │   ├── SearchBar.tsx
│   │   │   │   └── SearchResults.tsx
│   │   │   └── UI/
│   │   │       ├── LoadingSpinner.tsx
│   │   │       ├── ErrorMessage.tsx
│   │   │       └── Tooltip.tsx
│   │   ├── hooks/
│   │   │   ├── useWeather.ts
│   │   │   ├── useGeocode.ts
│   │   │   └── useMapNavigation.ts
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   └── mapStyle.ts
│   │   ├── types/
│   │   │   ├── weather.ts
│   │   │   ├── geo.ts
│   │   │   └── map.ts
│   │   ├── store/
│   │   │   └── useAppStore.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── public/
│   │   └── geojson/
│   │       ├── india-states.geojson
│   │       └── india-districts.geojson (optional, load on demand)
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── backend/                     # FastAPI app
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── routers/
│   │   │   ├── geocode.py
│   │   │   ├── weather.py
│   │   │   ├── india.py
│   │   │   └── cassandra.py
│   │   ├── services/
│   │   │   ├── open_meteo.py
│   │   │   ├── cassandra_client.py
│   │   │   └── cache.py
│   │   ├── models/
│   │   │   ├── weather.py
│   │   │   └── geo.py
│   │   └── utils/
│   │       └── helpers.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── docker-compose.yml           # Extended with frontend + backend
├── PROJECT_SPEC.md
└── README.md
```

---

## Key Design Decisions

1. **MapLibre over Cesium**: Start with MapLibre (lighter, faster to implement). Cesium for future terrain/3D buildings.

2. **Open-Meteo as Primary**: Free, no API key, global coverage, good India data. Cassandra for historical analytics.

3. **Three-Level Navigation**: Prevents overwhelming API calls. Load data on demand.

4. **Honest Data Attribution**: Always show source (Model vs Observed) and timestamp.

5. **Caching Strategy**: In-memory TTL cache first, Redis later if needed.

6. **TypeScript Everywhere**: Type safety for weather data, geo coordinates, API responses.

---

## Success Criteria

- [ ] Map loads in < 3 seconds
- [ ] Click → dashboard opens in < 500ms (cached)
- [ ] Search returns results in < 300ms
- [ ] Smooth 60fps map interactions
- [ ] Works on desktop and mobile
- [ ] Clear data freshness indicators
- [ ] Graceful degradation when APIs fail