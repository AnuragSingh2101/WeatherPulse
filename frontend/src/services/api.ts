import type {
  Coordinates,
  CurrentWeather,
  HourlyForecast,
  DailyForecast,
  WeatherAlert,
  WeatherTrends,
  GeocodeResult,
  IndiaOverviewResponse,
  StateWeatherSummary,
  DistrictWeatherSummary,
  WeatherDashboardData,
} from '../types';

export type { GeocodeResult };

const API_BASE = '/api';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

function toCamelCase(str: string): string {
  return str.replace(/_([a-z0-9])/g, (_, letter) => letter.toUpperCase());
}

function camelizeKeys<T>(obj: any): T {
  if (Array.isArray(obj)) {
    return obj.map((v) => camelizeKeys(v)) as any;
  }
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    const n: any = {};
    for (const key of Object.keys(obj)) {
      const camelKey = toCamelCase(key);
      const val = camelizeKeys(obj[key]);
      n[camelKey] = val;
      if (camelKey !== key) {
        n[key] = val;
      }
    }
    return n;
  }
  return obj;
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new ApiError(response.status, error.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return camelizeKeys<T>(data);
}

// Geocoding
export async function geocode(query: string, limit = 10): Promise<GeocodeResult[]> {
  const params = new URLSearchParams({
    q: query,
    limit: limit.toString(),
    country: 'IN', // Restrict to India
  });
  return fetchApi<GeocodeResult[]>(`/geocode?${params.toString()}`);
}

// Current Weather
export async function getCurrentWeather(lat: number, lon: number): Promise<CurrentWeather> {
  return fetchApi<CurrentWeather>(`/weather/current?lat=${lat}&lon=${lon}`);
}

// Forecast
export async function getForecast(
  lat: number,
  lon: number,
  options?: { hours?: number; days?: number }
): Promise<{ hourly: HourlyForecast[]; daily: DailyForecast[] }> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
    hours: (options?.hours || 48).toString(),
    days: (options?.days || 7).toString(),
  });
  return fetchApi<{ hourly: HourlyForecast[]; daily: DailyForecast[] }>(`/weather/forecast?${params.toString()}`);
}

// Historical
export async function getHistoricalWeather(
  lat: number,
  lon: number,
  days = 30
): Promise<WeatherTrends> {
  return fetchApi<WeatherTrends>(`/weather/historical?lat=${lat}&lon=${lon}&days=${days}`);
}

// Alerts
export async function getWeatherAlerts(lat: number, lon: number): Promise<WeatherAlert[]> {
  return fetchApi<WeatherAlert[]>(`/weather/alerts?lat=${lat}&lon=${lon}`);
}

// India Overview
export async function getIndiaOverview(): Promise<IndiaOverviewResponse> {
  return fetchApi<IndiaOverviewResponse>('/india/overview');
}

// State Weather
export async function getStateWeather(stateCode: string): Promise<StateWeatherSummary> {
  return fetchApi<StateWeatherSummary>(`/india/state/${stateCode}`);
}

// Districts in State
export async function getStateDistricts(stateCode: string): Promise<DistrictWeatherSummary[]> {
  return fetchApi<DistrictWeatherSummary[]>(`/india/state/${stateCode}/districts`);
}

// Complete Dashboard Data (single call for convenience)
export async function getDashboardData(lat: number, lon: number, locationName: string): Promise<WeatherDashboardData> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
    name: locationName,
  });
  return fetchApi<WeatherDashboardData>(`/weather/dashboard?${params.toString()}`);
}

// Cassandra Historical
export async function getCassandraHistorical(city: string, days = 30): Promise<WeatherTrends> {
  return fetchApi<WeatherTrends>(`/cassandra/historical?city=${encodeURIComponent(city)}&days=${days}`);
}

// Health Check
export async function healthCheck(): Promise<{ status: string; timestamp: string }> {
  return fetchApi<{ status: string; timestamp: string }>('/health');
}

export { ApiError };