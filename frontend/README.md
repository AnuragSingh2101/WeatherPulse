# 🗺️ Frontend Application - Interactive 3D India Weather Map

Interactive 3D weather visualization application for India built with **React 18**, **TypeScript**, **Vite**, **MapLibre GL JS**, **Zustand**, and **Tailwind CSS**, served through a production **Nginx** reverse proxy.

---

## 🎨 Visual Design & Aesthetics

The frontend is built to provide an immersive, state-of-the-art interactive experience:
- **3D Polygon Extrusions**: Every Indian state and union territory is extruded in 3D perspective based on real-time temperature (up to 300,000m height).
- **Dynamic Heat Gradient**: Smooth color interpolation from freezing blue (`#0d47a1`) through temperate green (`#4caf50`) to extreme heat red (`#b71c1c`).
- **Watermark-Free Dark Basemap**: Uses ESRI World Dark Gray Canvas raster tiles for crisp landmass and ocean contrast.
- **Glassmorphic UI**: Translucent blurred backdrop panels (`backdrop-blur-md`), dark mode slate accents (`#020617`), and subtle cyan neon highlights (`#38bdf8`).
- **Smooth Camera Transitions**: Animated `flyTo` transitions between the national view, state-level zooms, and city coordinates.

---

## 🏗️ Architecture & Component Hierarchy

```
frontend/
├── src/
│   ├── assets/
│   │   └── geojson/         # TypeScript-encoded India states boundary GeoJSON
│   ├── components/
│   │   ├── Map/             # MapLibre map initialization, 3D extruded layers, markers
│   │   │   ├── MapContainer.tsx
│   │   │   └── index.ts
│   │   ├── Dashboard/       # Slide-out weather analytics sidebar
│   │   │   ├── WeatherDashboard.tsx
│   │   │   ├── CurrentConditions.tsx
│   │   │   ├── Forecast.tsx
│   │   │   ├── HistoricalCharts.tsx
│   │   │   ├── Alerts.tsx
│   │   │   ├── DataFreshness.tsx
│   │   │   └── index.ts
│   │   ├── Search/          # Debounced city search bar with keyboard navigation
│   │   │   ├── SearchBar.tsx
│   │   │   └── index.ts
│   │   └── UI/              # Buttons, cards, and modal primitives
│   ├── hooks/               # Custom React hooks & TanStack Query integrations
│   │   ├── useWeather.ts    # React Query caching for current, forecast, history
│   │   └── useGeocode.ts    # Open-Meteo search and debounced geocoding
│   ├── services/            # API integration & MapLibre utilities
│   │   ├── api.ts           # Axios/Fetch HTTP client for backend endpoints
│   │   └── mapUtils.ts      # Style configurations, bounds, color interpolation
│   ├── store/               # Centralized Zustand global state
│   │   └── useAppStore.ts   # Viewport, selectedLocation, activeState, navigationLevel
│   ├── types/               # TypeScript interfaces & meteorological models
│   ├── App.tsx              # Root shell layout & event coordinator
│   └── main.tsx             # React DOM root entry point
├── public/                  # Static assets & icons
├── nginx.conf               # Production Nginx reverse-proxy configuration
├── Dockerfile               # Multi-stage Node 20 builder & Nginx Alpine runtime
└── package.json             # Dependencies & build scripts
```

---

## 🛠️ State Management & Data Flow

1. **Zustand (`useAppStore.ts`)**:
   - Manages client-side navigation level (`india` | `state` | `district` | `city`).
   - Tracks 3D camera coordinates (`center`, `zoom`, `pitch`, `bearing`).
   - Coordinates active state selection, open/closed state of the dashboard drawer, and selected coordinates.

2. **TanStack React Query (`useWeather.ts`)**:
   - Handles network fetching, retries, and in-memory TTL caching (10 min for current weather, 30 min for forecast, 60 min for Cassandra historical).
   - Prevents redundant API requests when panning or clicking across recently inspected regions.

3. **Nginx Reverse Proxy (`nginx.conf`)**:
   - In production Docker containers, Nginx listens on port `3000` (supporting both IPv4 `0.0.0.0` and IPv6 `[::]`).
   - Routes `/api/` traffic directly to the internal `backend:8000/api/` network bridge.
   - Provides an immediate healthcheck endpoint at `/health` returning `200 healthy`.

---

## 🚀 How to Run

### Option 1: Docker Compose (Full Stack)
The frontend container is automatically built and orchestrated from root:
```bash
docker compose up -d frontend
```

#### Accessing in Your Browser:
* **Primary URL**: **[http://127.0.0.1:3000](http://127.0.0.1:3000)** *(Recommended on Windows)*
* **Alternative URL**: **[http://localhost:5173](http://localhost:5173)** *(Mapped to container port 3000)*

> [!NOTE]
> On Windows machines, Windows system processes may bind to `[::1]:3000`. Navigating to `http://127.0.0.1:3000` or `http://localhost:5173` ensures your browser connects directly to Docker without port hijacking.

---

### Option 2: Local Vite Development Server

1. **Install Node.js dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment variables**:
   Create or edit `.env`:
   ```env
   VITE_API_URL=http://localhost:8000
   ```

3. **Start the Vite dev server**:
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:5173` with instant Hot Module Replacement (HMR).

4. **Production Build**:
   ```bash
   npm run build
   ```
   Outputs the minified, production-ready static assets to `dist/`.

---

## ⌨️ Controls & Interaction Guide

* **Click on any State**: Smoothly zooms and tilts into the state boundaries and automatically opens the weather analytics drawer.
* **Click anywhere on the Map**: Places a pulsating locator marker and retrieves live weather at that exact geographic coordinate.
* **Search Bar**: Type any city or town in India (e.g., "Kolkata", "Bengaluru", "Delhi") and select from suggestions using mouse or arrow keys (`↑`/`↓`/`Enter`).
* **Home Button (or `Escape` key)**: Resets camera pitch and flies back to the full national overview of India.
