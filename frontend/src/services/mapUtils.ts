import type { Coordinates, BoundingBox, WeatherLayer } from '../types';
import type { LayerSpecification } from 'maplibre-gl';

// State bounds data
export const STATE_BOUNDS: Record<string, { center: Coordinates; minLat: number; maxLat: number; minLon: number; maxLon: number }> = {
  'MH': { minLat: 15.6, maxLat: 22.1, minLon: 72.6, maxLon: 80.9, center: { lat: 19.7515, lon: 75.7139 } },
  'KA': { minLat: 11.5, maxLat: 18.5, minLon: 74.0, maxLon: 78.5, center: { lat: 15.3173, lon: 75.7139 } },
  'TN': { minLat: 8.0, maxLat: 13.5, minLon: 76.2, maxLon: 80.3, center: { lat: 11.1271, lon: 78.6569 } },
  'DL': { minLat: 28.4, maxLat: 28.9, minLon: 76.8, maxLon: 77.3, center: { lat: 28.7041, lon: 77.1025 } },
  'GJ': { minLat: 20.1, maxLat: 24.7, minLon: 68.2, maxLon: 74.5, center: { lat: 22.2587, lon: 71.1924 } },
  'RJ': { minLat: 23.0, maxLat: 30.2, minLon: 69.5, maxLon: 78.2, center: { lat: 27.0238, lon: 74.2179 } },
  'UP': { minLat: 23.9, maxLat: 30.4, minLon: 77.0, maxLon: 84.6, center: { lat: 26.8467, lon: 80.9462 } },
  'WB': { minLat: 21.5, maxLat: 27.2, minLon: 85.8, maxLon: 89.8, center: { lat: 22.9868, lon: 87.8550 } },
  'KL': { minLat: 8.2, maxLat: 12.8, minLon: 74.8, maxLon: 77.4, center: { lat: 10.8505, lon: 76.2711 } },
  'AP': { minLat: 12.6, maxLat: 19.9, minLon: 76.8, maxLon: 84.8, center: { lat: 15.9129, lon: 79.7400 } },
  'TS': { minLat: 15.8, maxLat: 19.9, minLon: 77.2, maxLon: 81.8, center: { lat: 18.1124, lon: 79.0193 } },
  'PB': { minLat: 29.5, maxLat: 32.5, minLon: 73.9, maxLon: 76.9, center: { lat: 31.1471, lon: 75.3412 } },
  'HR': { minLat: 27.6, maxLat: 30.9, minLon: 74.5, maxLon: 77.6, center: { lat: 29.0588, lon: 76.0856 } },
  'BR': { minLat: 24.3, maxLat: 27.5, minLon: 83.3, maxLon: 88.3, center: { lat: 25.0961, lon: 85.3131 } },
  'OR': { minLat: 17.8, maxLat: 22.6, minLon: 81.3, maxLon: 87.5, center: { lat: 20.9517, lon: 85.0985 } },
  'MP': { minLat: 21.1, maxLat: 26.9, minLon: 74.0, maxLon: 82.8, center: { lat: 22.9734, lon: 78.6569 } },
  'AS': { minLat: 24.1, maxLat: 28.0, minLon: 89.7, maxLon: 96.0, center: { lat: 26.2006, lon: 92.9376 } },
  'JH': { minLat: 21.9, maxLat: 25.4, minLon: 83.3, maxLon: 87.9, center: { lat: 23.6102, lon: 85.2799 } },
  'CT': { minLat: 17.8, maxLat: 24.1, minLon: 80.2, maxLon: 84.4, center: { lat: 21.2787, lon: 81.8661 } },
  'UK': { minLat: 28.4, maxLat: 31.4, minLon: 77.5, maxLon: 81.1, center: { lat: 30.0668, lon: 79.0193 } },
  'HP': { minLat: 30.4, maxLat: 33.3, minLon: 75.6, maxLon: 79.1, center: { lat: 31.1048, lon: 77.1734 } },
  'JK': { minLat: 32.2, maxLat: 37.1, minLon: 72.6, maxLon: 80.3, center: { lat: 33.7782, lon: 76.5762 } },
  'GA': { minLat: 14.9, maxLat: 15.8, minLon: 73.7, maxLon: 74.3, center: { lat: 15.2993, lon: 74.1240 } },
  'MN': { minLat: 23.8, maxLat: 25.7, minLon: 93.0, maxLon: 94.8, center: { lat: 24.6637, lon: 93.9063 } },
  'ML': { minLat: 25.0, maxLat: 26.1, minLon: 89.7, maxLon: 92.9, center: { lat: 25.4670, lon: 91.3662 } },
  'NL': { minLat: 25.2, maxLat: 27.0, minLon: 93.2, maxLon: 95.2, center: { lat: 26.1584, lon: 94.5624 } },
  'TR': { minLat: 22.9, maxLat: 24.5, minLon: 91.1, maxLon: 92.4, center: { lat: 23.9408, lon: 91.9882 } },
  'MZ': { minLat: 21.9, maxLat: 24.5, minLon: 92.2, maxLon: 93.5, center: { lat: 23.1645, lon: 92.9376 } },
  'AR': { minLat: 26.3, maxLat: 29.5, minLon: 91.3, maxLon: 97.5, center: { lat: 28.2180, lon: 94.7278 } },
  'SK': { minLat: 27.0, maxLat: 28.1, minLon: 88.0, maxLon: 88.9, center: { lat: 27.5330, lon: 88.5122 } },
  'PY': { minLat: 10.9, maxLat: 12.0, minLon: 79.6, maxLon: 79.9, center: { lat: 11.9416, lon: 79.8083 } },
  'AN': { minLat: 6.5, maxLat: 14.5, minLon: 92.2, maxLon: 94.0, center: { lat: 11.7401, lon: 92.6586 } },
  'CH': { minLat: 30.6, maxLat: 30.8, minLon: 76.6, maxLon: 76.9, center: { lat: 30.7333, lon: 76.7794 } },
  'DN': { minLat: 20.1, maxLat: 20.5, minLon: 72.8, maxLon: 73.2, center: { lat: 20.3974, lon: 72.8328 } },
  'DD': { minLat: 20.7, maxLat: 20.9, minLon: 70.9, maxLon: 71.0, center: { lat: 20.7602, lon: 70.9765 } },
  'LD': { minLat: 8.2, maxLat: 12.3, minLon: 71.5, maxLon: 74.0, center: { lat: 10.5667, lon: 72.6417 } },
  'LA': { minLat: 32.2, maxLat: 33.3, minLon: 76.6, maxLon: 79.1, center: { lat: 34.2996, lon: 78.2932 } },
};

// Convert GeoJSON to MapLibre style layers
export function getLayerPaintExpressions(layer: WeatherLayer = 'temperature') {
  switch (layer) {
    case 'precipitation':
      return {
        color: [
          'interpolate',
          ['linear'],
          ['coalesce', ['get', 'precipitation'], 0],
          0, '#0f172a',
          2, '#38bdf8',
          10, '#0284c7',
          25, '#2563eb',
          50, '#4338ca',
          100, '#6b21a8',
        ],
        height: [
          'interpolate',
          ['linear'],
          ['coalesce', ['get', 'precipitation'], 0],
          0, 20000,
          10, 60000,
          30, 140000,
          100, 280000,
        ],
      };
    case 'wind':
      return {
        color: [
          'interpolate',
          ['linear'],
          ['coalesce', ['get', 'windSpeed'], 5],
          0, '#06b6d4',
          15, '#10b981',
          35, '#f59e0b',
          60, '#ea580c',
          90, '#dc2626',
        ],
        height: [
          'interpolate',
          ['linear'],
          ['coalesce', ['get', 'windSpeed'], 5],
          0, 20000,
          20, 70000,
          50, 160000,
          100, 260000,
        ],
      };
    case 'alerts':
      return {
        color: [
          'match',
          ['coalesce', ['get', 'alertLevel'], 'none'],
          'extreme', '#dc2626',
          'high', '#ea580c',
          'moderate', '#d97706',
          'low', '#eab308',
          '#1e293b',
        ],
        height: [
          'match',
          ['coalesce', ['get', 'alertLevel'], 'none'],
          'extreme', 260000,
          'high', 190000,
          'moderate', 120000,
          'low', 70000,
          20000,
        ],
      };
    case 'temperature':
    default:
      return {
        color: [
          'interpolate',
          ['linear'],
          ['coalesce', ['get', 'temperature'], 25],
          -10, '#0d47a1',   // Very cold - dark blue
          0, '#1565c0',     // Cold - blue
          10, '#2196f3',    // Cool - light blue
          20, '#4caf50',    // Mild - green
          25, '#8bc34a',    // Pleasant - light green
          30, '#ffeb3b',    // Warm - yellow
          35, '#ff9800',    // Hot - orange
          40, '#f44336',    // Very hot - red
          45, '#b71c1c',    // Extreme - dark red
        ],
        height: [
          'interpolate',
          ['linear'],
          ['coalesce', ['get', 'temperature'], 25],
          -10, 40000,
          0, 60000,
          10, 80000,
          20, 110000,
          25, 140000,
          30, 170000,
          35, 200000,
          40, 240000,
          45, 290000,
        ],
      };
  }
}

export function createStateLayers(geojson: GeoJSON.FeatureCollection, layer: WeatherLayer = 'temperature'): LayerSpecification[] {
  const expressions = getLayerPaintExpressions(layer);
  return [
    {
      id: 'states-fill-extrusion',
      type: 'fill-extrusion',
      source: 'states',
      paint: {
        'fill-extrusion-color': expressions.color as any,
        'fill-extrusion-height': expressions.height as any,
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 0.7,
      },
    },
    {
      id: 'states-outline',
      type: 'line',
      source: 'states',
      paint: {
        'line-color': '#38bdf8',
        'line-width': 1.5,
        'line-opacity': 0.8,
      },
    },
    {
      id: 'states-labels',
      type: 'symbol',
      source: 'states',
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Noto Sans Regular'],
        'text-size': 12,
        'text-anchor': 'center',
        'text-allow-overlap': false,
        'text-ignore-placement': false,
      },
      paint: {
        'text-color': '#e2e8f0',
        'text-halo-color': '#0f172a',
        'text-halo-width': 2,
        'text-halo-blur': 1,
      },
    },
  ];
}

export function createDistrictLayers(geojson: GeoJSON.FeatureCollection): LayerSpecification[] {
  return [
    {
      id: 'districts-fill',
      type: 'fill',
      source: 'districts',
      paint: {
        'fill-color': [
          'interpolate',
          ['linear'],
          ['coalesce', ['get', 'temperature'], 25],
          -10, '#0d47a1',
          0, '#1565c0',
          10, '#2196f3',
          20, '#4caf50',
          25, '#8bc34a',
          30, '#ffeb3b',
          35, '#ff9800',
          40, '#f44336',
          45, '#b71c1c',
        ],
        'fill-opacity': 0.6,
      },
    },
    {
      id: 'districts-outline',
      type: 'line',
      source: 'districts',
      paint: {
        'line-color': '#475569',
        'line-width': 1,
        'line-opacity': 0.6,
      },
    },
    {
      id: 'districts-labels',
      type: 'symbol',
      source: 'districts',
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Noto Sans Regular'],
        'text-size': 10,
        'text-anchor': 'center',
      },
      paint: {
        'text-color': '#94a3b8',
        'text-halo-color': '#0f172a',
        'text-halo-width': 1.5,
      },
    },
  ];
}

export function createWeatherMarkerLayers(): LayerSpecification[] {
  return [
    {
      id: 'weather-markers',
      type: 'circle',
      source: 'weather-markers',
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          4, 4,
          6, 6,
          8, 8,
          10, 10,
        ],
        'circle-color': [
          'interpolate',
          ['linear'],
          ['coalesce', ['get', 'temperature'], 25],
          -10, '#0ea5e9',
          0, '#38bdf8',
          10, '#22d3ee',
          20, '#84cc16',
          25, '#a3e635',
          30, '#eab308',
          35, '#f97316',
          40, '#ef4444',
          45, '#b91c1c',
        ],
        'circle-stroke-color': '#0f172a',
        'circle-stroke-width': 2,
        'circle-opacity': 0.9,
      },
    },
    {
      id: 'weather-markers-glow',
      type: 'circle',
      source: 'weather-markers',
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          4, 8,
          6, 12,
          8, 16,
          10, 20,
        ],
        'circle-color': [
          'interpolate',
          ['linear'],
          ['coalesce', ['get', 'temperature'], 25],
          -10, '#0ea5e9',
          0, '#38bdf8',
          10, '#22d3ee',
          20, '#84cc16',
          25, '#a3e635',
          30, '#eab308',
          35, '#f97316',
          40, '#ef4444',
          45, '#b91c1c',
        ],
        'circle-opacity': 0.3,
      },
    },
    {
      id: 'weather-markers-pulse',
      type: 'circle',
      source: 'weather-markers',
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          4, 12,
          6, 18,
          8, 24,
          10, 30,
        ],
        'circle-color': [
          'interpolate',
          ['linear'],
          ['get', 'temperature'],
          -10, '#0ea5e9',
          0, '#38bdf8',
          10, '#22d3ee',
          20, '#84cc16',
          25, '#a3e635',
          30, '#eab308',
          35, '#f97316',
          40, '#ef4444',
          45, '#b91c1c',
        ],
        'circle-opacity': 0.15,
      },
    },
  ];
}

export function createSelectedLocationLayer(): LayerSpecification {
  return {
    id: 'selected-location',
    type: 'circle',
    source: 'selected-location',
    paint: {
      'circle-radius': 14,
      'circle-color': '#ffffff',
      'circle-stroke-color': '#0ea5e9',
      'circle-stroke-width': 3,
      'circle-opacity': 1,
    },
  };
}

export function createSelectedLocationPulseLayer(): LayerSpecification {
  return {
    id: 'selected-location-pulse',
    type: 'circle',
    source: 'selected-location',
    paint: {
      'circle-radius': 24,
      'circle-color': '#0ea5e9',
      'circle-opacity': 0.4,
    },
  };
}

// Color utilities for weather
export function getTemperatureColor(temp: number): string {
  if (temp <= -10) return '#0d47a1';
  if (temp <= 0) return '#1565c0';
  if (temp <= 10) return '#2196f3';
  if (temp <= 20) return '#4caf50';
  if (temp <= 25) return '#8bc34a';
  if (temp <= 30) return '#ffeb3b';
  if (temp <= 35) return '#ff9800';
  if (temp <= 40) return '#f44336';
  return '#b71c1c';
}

export function getPrecipitationColor(precip: number): string {
  if (precip <= 0) return '#1e293b';
  if (precip <= 2.5) return '#0ea5e9';
  if (precip <= 10) return '#38bdf8';
  if (precip <= 25) return '#22d3ee';
  if (precip <= 50) return '#84cc16';
  if (precip <= 75) return '#eab308';
  if (precip <= 100) return '#f97316';
  return '#ef4444';
}

export function getAlertColor(severity: string): string {
  switch (severity) {
    case 'info': return '#0ea5e9';
    case 'warning': return '#eab308';
    case 'severe': return '#f97316';
    case 'extreme': return '#ef4444';
    default: return '#64748b';
  }
}

export function getWeatherDescription(code: number): string {
  const descriptions: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };
  return descriptions[code] || 'Unknown';
}

export function getWindDirectionText(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

// Map style configuration
export const MAP_STYLE = {
  version: 8 as const,
  name: 'India Weather Dark',
  sources: {
    'esri-dark': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: '&copy; Esri, HERE, Garmin, &copy; OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#020617',
      },
    },
    {
      id: 'esri-dark-tiles',
      type: 'raster',
      source: 'esri-dark',
      minzoom: 0,
      maxzoom: 20,
    },
  ],
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sprite: 'https://demotiles.maplibre.org/sprite',
};

// Viewport constants
export const INDIA_VIEWPORT: { center: Coordinates; zoom: number; bearing: number; pitch: number } = {
  center: { lat: 22.5937, lon: 78.9629 },
  zoom: 4,
  bearing: 0,
  pitch: 45,
};

export const INDIA_BOUNDS: BoundingBox = {
  minLat: 6.5,
  maxLat: 37.5,
  minLon: 68.5,
  maxLon: 97.5,
};

export function getStateBounds(stateCode: string): { center: Coordinates; bounds: BoundingBox } | null {
  const state = STATE_BOUNDS[stateCode.toUpperCase()];
  if (!state) return null;
  const { center, minLat, maxLat, minLon, maxLon } = state;
  return { center, bounds: { minLat, maxLat, minLon, maxLon } };
}

export function getDistrictBounds(stateCode: string, districtCode: string): { center: Coordinates; bounds: BoundingBox } | null {
  // Placeholder - would be populated from district GeoJSON
  return getStateBounds(stateCode);
}

// Format coordinates for display
export function formatCoordinates(coords: Coordinates): string {
  const latDir = coords.lat >= 0 ? 'N' : 'S';
  const lonDir = coords.lon >= 0 ? 'E' : 'W';
  return `${Math.abs(coords.lat).toFixed(4)}°${latDir}, ${Math.abs(coords.lon).toFixed(4)}°${lonDir}`;
}

// Calculate distance between two coordinates (Haversine formula)
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLon = toRad(coord2.lon - coord1.lon);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}