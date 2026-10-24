import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  MapPin,
  Navigation,
  Play,
  Square,
  RefreshCw,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  CloudRain,
  Wind,
  Droplets,
  Gauge,
  Cloud,
  Thermometer,
  Radio,
  ExternalLink,
  Info,
} from 'lucide-react';
import { LeafletMap } from './LeafletMap';
import {
  searchLocations,
  reverseGeocodeLocation,
  getMETNorwayForecast,
  startWeatherStream,
  stopWeatherStream,
  getWeatherStreamStatus,
} from '../../services/api';
import type {
  Coordinates,
  LocationSearchResult,
  METNorwayForecastResponse,
  METNorwayPoint,
  WeatherStreamStatus,
} from '../../types';

interface WeatherExplorerProps {
  onClose?: () => void;
}

export function WeatherExplorer({ onClose }: WeatherExplorerProps) {
  // Location selection state
  const [selectedCoords, setSelectedCoords] = useState<Coordinates>({ lat: 12.9716, lon: 77.5946 });
  const [selectedName, setSelectedName] = useState<string>('Bengaluru');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Geolocation state
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Forecast state (MET Norway)
  const [forecast, setForecast] = useState<METNorwayForecastResponse | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastError, setForecastError] = useState<string | null>(null);

  // Kafka Streaming state
  const [streamStatus, setStreamStatus] = useState<WeatherStreamStatus | null>(null);
  const [streamLoading, setStreamLoading] = useState(false);
  const [streamActionError, setStreamActionError] = useState<string | null>(null);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Fetch forecast for coordinates from MET Norway
  const fetchForecast = useCallback(async (coords: Coordinates, locName?: string) => {
    setForecastLoading(true);
    setForecastError(null);
    try {
      const data = await getMETNorwayForecast(coords.lat, coords.lon);
      setForecast(data);
      if (locName) setSelectedName(locName);
    } catch (err: any) {
      setForecastError(err.message || 'Failed to retrieve forecast from MET Norway.');
    } finally {
      setForecastLoading(false);
    }
  }, []);

  // Fetch initial forecast on mount
  useEffect(() => {
    fetchForecast(selectedCoords, selectedName);
  }, []);

  // Fetch Kafka Stream status and poll periodically
  const refreshStreamStatus = useCallback(async () => {
    try {
      const status = await getWeatherStreamStatus();
      setStreamStatus(status);
    } catch (err) {
      // Ignore polling errors
    }
  }, []);

  useEffect(() => {
    refreshStreamStatus();
    const interval = setInterval(refreshStreamStatus, 5000);
    return () => clearInterval(interval);
  }, [refreshStreamStatus]);

  // Handle map click
  const handleMapLocationSelect = async (coords: Coordinates) => {
    setSelectedCoords(coords);
    try {
      const reverse = await reverseGeocodeLocation(coords.lat, coords.lon);
      const name = reverse?.name || `Location (${coords.lat}, ${coords.lon})`;
      setSelectedName(name);
      fetchForecast(coords, name);
    } catch {
      const fallbackName = `Coordinates (${coords.lat}, ${coords.lon})`;
      setSelectedName(fallbackName);
      fetchForecast(coords, fallbackName);
    }
  };

  // Debounced search using OpenStreetMap Nominatim
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setSearchError(null);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (!val.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    searchDebounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchLocations(val.trim(), 5);
        setSearchResults(results);
        setShowDropdown(true);
        if (results.length === 0) {
          setSearchError(`No matching places found for "${val}".`);
        }
      } catch (err: any) {
        setSearchError('Search service temporarily unavailable.');
      } finally {
        setIsSearching(false);
      }
    }, 350); // 350ms debounce
  };

  // Handle selecting a place from dropdown
  const handleSelectSearchResult = (result: LocationSearchResult) => {
    const coords: Coordinates = {
      lat: Number(result.latitude.toFixed(4)),
      lon: Number(result.longitude.toFixed(4)),
    };
    setSelectedCoords(coords);
    setSelectedName(result.name || result.displayName.split(',')[0]);
    setShowDropdown(false);
    setSearchQuery('');
    fetchForecast(coords, result.name);
  };

  // Browser Geolocation API ("Use My Location")
  const handleUseMyLocation = () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError('Browser geolocation is not supported on this device.');
      return;
    }

    // Check if secure context
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setGeoError('Browser Geolocation API requires HTTPS or localhost.');
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setGeoLoading(false);
        const coords: Coordinates = {
          lat: Number(pos.coords.latitude.toFixed(4)),
          lon: Number(pos.coords.longitude.toFixed(4)),
        };
        setSelectedCoords(coords);

        try {
          const rev = await reverseGeocodeLocation(coords.lat, coords.lon);
          const name = rev?.name || 'My Current Location';
          setSelectedName(name);
          fetchForecast(coords, name);
        } catch {
          setSelectedName('My Current Location');
          fetchForecast(coords, 'My Current Location');
        }
      },
      (err) => {
        setGeoLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setGeoError('Location permission denied. Please allow location access in your browser settings.');
            break;
          case err.POSITION_UNAVAILABLE:
            setGeoError('Location information is unavailable.');
            break;
          case err.TIMEOUT:
            setGeoError('Location request timed out. Please try again.');
            break;
          default:
            setGeoError(err.message || 'An error occurred while retrieving location.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Start Kafka Ingestion
  const handleStartIngestion = async () => {
    setStreamLoading(true);
    setStreamActionError(null);
    try {
      const updated = await startWeatherStream([
        {
          name: selectedName,
          latitude: selectedCoords.lat,
          longitude: selectedCoords.lon,
        },
      ]);
      setStreamStatus(updated);
    } catch (err: any) {
      setStreamActionError(err.message || 'Failed to start Kafka ingestion.');
    } finally {
      setStreamLoading(false);
    }
  };

  // Stop Kafka Ingestion
  const handleStopIngestion = async () => {
    setStreamLoading(true);
    setStreamActionError(null);
    try {
      const updated = await stopWeatherStream();
      setStreamStatus(updated);
    } catch (err: any) {
      setStreamActionError(err.message || 'Failed to stop Kafka ingestion.');
    } finally {
      setStreamLoading(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const current = forecast?.current;

  return (
    <div className="flex flex-col h-full overflow-y-auto space-y-5 p-4 lg:p-6 text-white bg-dark-950/95">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-dark-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">Weather Explorer</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
              MET Norway + Kafka
            </span>
          </div>
          <p className="text-xs text-dark-400 mt-0.5">
            Interactive coordinates selection, MET Norway Locationforecast 2.0 & Apache Kafka streaming ingestion
          </p>
        </div>

        {/* Kafka Streaming Control Pill */}
        <div className="flex items-center gap-2">
          {streamStatus?.isRunning ? (
            <button
              onClick={handleStopIngestion}
              disabled={streamLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 text-xs font-semibold transition-all active:scale-95"
              title="Stop Kafka Ingestion Worker"
            >
              {streamLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Square className="w-3.5 h-3.5 fill-red-400" />}
              <span>Stop Ingestion</span>
            </button>
          ) : (
            <button
              onClick={handleStartIngestion}
              disabled={streamLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-all active:scale-95"
              title="Start Streaming Selected Location to Kafka"
            >
              {streamLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-emerald-400" />}
              <span>Start Kafka Stream</span>
            </button>
          )}

          <button
            onClick={() => fetchForecast(selectedCoords, selectedName)}
            disabled={forecastLoading}
            className="p-1.5 rounded-xl bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-white border border-dark-700 transition-colors"
            title="Refresh Forecast"
          >
            <RefreshCw className={`w-4 h-4 ${forecastLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search & Location Controls Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
        {/* Nominatim Search Input */}
        <div ref={searchContainerRef} className="relative md:col-span-8">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-dark-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
              placeholder="Search city, town, or place (OpenStreetMap Nominatim)..."
              className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-dark-900 border border-dark-700 text-sm text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
            />
            {isSearching && (
              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin absolute right-3 pointer-events-none" />
            )}
          </div>

          {/* Suggestions Dropdown */}
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1.5 z-[500] glass-panel rounded-xl border border-dark-700/80 shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
              {searchResults.length > 0 ? (
                searchResults.map((item, idx) => (
                  <button
                    key={item.placeId || idx}
                    onClick={() => handleSelectSearchResult(item)}
                    className="w-full px-3.5 py-2.5 text-left text-xs hover:bg-cyan-500/10 hover:text-cyan-300 border-b border-dark-800/60 last:border-none flex items-start gap-2.5 transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">{item.name}</p>
                      <p className="text-[11px] text-dark-400 truncate">{item.displayName}</p>
                    </div>
                  </button>
                ))
              ) : searchError ? (
                <div className="p-3 text-xs text-dark-400 text-center">{searchError}</div>
              ) : null}
            </div>
          )}
        </div>

        {/* Use My Location Button */}
        <div className="md:col-span-4 flex items-center gap-2">
          <button
            onClick={handleUseMyLocation}
            disabled={geoLoading}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 hover:text-white border border-cyan-500/30 text-xs font-semibold transition-all active:scale-95 shadow-md"
            title="Locate via browser Geolocation API"
          >
            {geoLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            ) : (
              <Navigation className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span>Use My Location</span>
          </button>
        </div>
      </div>

      {/* Geolocation Error Alert */}
      {geoError && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
          <span>{geoError}</span>
        </div>
      )}

      {/* Stream Action Error Alert */}
      {streamActionError && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
          <span>{streamActionError}</span>
        </div>
      )}

      {/* Selected Location Pill & Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl glass-card border border-white/5 bg-dark-900/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">{selectedName}</span>
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                {selectedCoords.lat.toFixed(4)}°N, {selectedCoords.lon.toFixed(4)}°E
              </span>
            </div>
            <p className="text-[11px] text-dark-400">
              Provider: MET Norway Locationforecast 2.0 (Compact)
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchForecast(selectedCoords, selectedName)}
          disabled={forecastLoading}
          className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
        >
          {forecastLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          <span>Get Forecast</span>
        </button>
      </div>

      {/* Interactive Leaflet Map Container */}
      <div className="h-[280px] w-full">
        <LeafletMap
          selectedLocation={selectedCoords}
          onLocationSelect={handleMapLocationSelect}
        />
      </div>

      {/* Forecast Error or Loading State */}
      {forecastError ? (
        <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-red-500/10 border border-red-500/30 text-center gap-2">
          <AlertTriangle className="w-8 h-8 text-red-400" />
          <p className="text-sm font-semibold text-white">Forecast Unavailable</p>
          <p className="text-xs text-red-300 max-w-md">{forecastError}</p>
          <button
            onClick={() => fetchForecast(selectedCoords, selectedName)}
            className="btn-primary text-xs mt-2"
          >
            Retry Fetch
          </button>
        </div>
      ) : forecastLoading && !forecast ? (
        <div className="flex flex-col items-center justify-center p-8 gap-3">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-xs text-dark-400">Retrieving MET Norway meteorological forecast...</p>
        </div>
      ) : current ? (
        <>
          {/* Current Forecast Summary Cards Grid */}
          <div>
            <h3 className="text-xs font-bold text-dark-400 uppercase tracking-wider mb-2.5">
              Live Forecast Telemetry ({selectedName})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {/* Temperature */}
              <div className="glass-card p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between text-dark-400">
                  <span className="text-[11px] font-medium">Temperature</span>
                  <Thermometer className="w-4 h-4 text-amber-400" />
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-bold text-white">
                    {current.airTemperatureC !== undefined ? `${Math.round(current.airTemperatureC)}°C` : 'N/A'}
                  </span>
                  <p className="text-[10px] text-dark-400 mt-0.5">{current.condition || 'Fair'}</p>
                </div>
              </div>

              {/* Relative Humidity */}
              <div className="glass-card p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between text-dark-400">
                  <span className="text-[11px] font-medium">Humidity</span>
                  <Droplets className="w-4 h-4 text-blue-400" />
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-bold text-white">
                    {current.relativeHumidityPercent !== undefined ? `${current.relativeHumidityPercent}%` : 'N/A'}
                  </span>
                  <p className="text-[10px] text-dark-400 mt-0.5">
                    Dew: {current.dewPointC !== undefined ? `${current.dewPointC}°C` : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Wind Speed & Direction */}
              <div className="glass-card p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between text-dark-400">
                  <span className="text-[11px] font-medium">Wind</span>
                  <Wind className="w-4 h-4 text-teal-400" />
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-bold text-white">
                    {current.windSpeedMps !== undefined ? `${current.windSpeedMps} m/s` : 'N/A'}
                  </span>
                  <p className="text-[10px] text-dark-400 mt-0.5">
                    {current.windDirectionText} ({current.windDirectionDegrees ?? 0}°)
                  </p>
                </div>
              </div>

              {/* Air Pressure */}
              <div className="glass-card p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between text-dark-400">
                  <span className="text-[11px] font-medium">Pressure</span>
                  <Gauge className="w-4 h-4 text-purple-400" />
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-bold text-white">
                    {current.airPressureHpa !== undefined ? `${Math.round(current.airPressureHpa)}` : 'N/A'}
                  </span>
                  <p className="text-[10px] text-dark-400 mt-0.5">hPa (sea level)</p>
                </div>
              </div>

              {/* Cloud Coverage */}
              <div className="glass-card p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between text-dark-400">
                  <span className="text-[11px] font-medium">Cloud Area</span>
                  <Cloud className="w-4 h-4 text-sky-400" />
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-bold text-white">
                    {current.cloudAreaFractionPercent !== undefined ? `${Math.round(current.cloudAreaFractionPercent)}%` : 'N/A'}
                  </span>
                  <p className="text-[10px] text-dark-400 mt-0.5">Coverage fraction</p>
                </div>
              </div>

              {/* Precipitation */}
              <div className="glass-card p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between text-dark-400">
                  <span className="text-[11px] font-medium">Precipitation</span>
                  <CloudRain className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-bold text-white">
                    {current.precipitationMm !== undefined ? `${current.precipitationMm} mm` : '0.0 mm'}
                  </span>
                  <p className="text-[10px] text-dark-400 mt-0.5">Expected next 1h</p>
                </div>
              </div>
            </div>
          </div>

          {/* 24-Hour Forecast Timeline */}
          {forecast?.forecastHourly && forecast.forecastHourly.length > 0 && (
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-dark-300 uppercase tracking-wider">
                  Hourly Forecast Timeline (Next 24h)
                </h3>
                <span className="text-[11px] text-dark-500">Updated: {forecast.updatedAt ? new Date(forecast.updatedAt).toLocaleTimeString() : 'Recent'}</span>
              </div>

              <div className="overflow-x-auto pb-2 scrollbar-thin">
                <div className="flex gap-2 min-w-max">
                  {forecast.forecastHourly.slice(0, 24).map((pt: METNorwayPoint, index: number) => {
                    const timeLabel = new Date(pt.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    return (
                      <div
                        key={index}
                        className="flex flex-col items-center justify-between p-2.5 rounded-xl bg-dark-900/60 border border-white/5 min-w-[76px] text-center"
                      >
                        <span className="text-[10px] text-dark-400 font-medium">{timeLabel}</span>
                        <div className="my-2">
                          <span className="text-sm font-bold text-white">
                            {pt.airTemperatureC !== undefined ? `${Math.round(pt.airTemperatureC)}°` : '-'}
                          </span>
                        </div>
                        <span className="text-[10px] text-cyan-400 truncate max-w-[68px]" title={pt.condition}>
                          {pt.condition || 'Fair'}
                        </span>
                        <div className="mt-1 flex items-center gap-0.5 text-[9px] text-dark-400">
                          <Wind className="w-2.5 h-2.5" />
                          <span>{pt.windSpeedMps ?? 0}m/s</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      ) : null}

      {/* Kafka Ingestion Live Stream Status Card */}
      <div className="glass-card p-4 border border-cyan-500/20 bg-dark-900/70">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-dark-800">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              {streamStatus?.isRunning && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  streamStatus?.isRunning ? 'bg-emerald-500' : 'bg-dark-600'
                }`}
              ></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              Kafka Streaming Pipeline
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                streamStatus?.isRunning
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-dark-800 text-dark-400 border border-dark-700'
              }`}
            >
              {streamStatus?.isRunning ? 'INGESTING LIVE' : 'IDLE'}
            </span>
          </div>

          <div className="text-[11px] font-mono text-dark-400">
            Topic: <span className="text-cyan-400 font-semibold">{streamStatus?.topic || 'weather-events'}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs">
          <div>
            <span className="text-[11px] text-dark-400">Configured Locations</span>
            <p className="font-semibold text-white mt-0.5">
              {streamStatus?.configuredLocations?.length || 1} Station(s)
            </p>
          </div>
          <div>
            <span className="text-[11px] text-dark-400">Events Published</span>
            <p className="font-semibold text-emerald-400 mt-0.5">
              {streamStatus?.publishedEventsCount || 0}
            </p>
          </div>
          <div>
            <span className="text-[11px] text-dark-400">Last Fetch</span>
            <p className="font-semibold text-white mt-0.5 truncate">
              {streamStatus?.lastSuccessfulFetchTime
                ? new Date(streamStatus.lastSuccessfulFetchTime).toLocaleTimeString()
                : 'None'}
            </p>
          </div>
          <div>
            <span className="text-[11px] text-dark-400">Poll Interval</span>
            <p className="font-semibold text-white mt-0.5">
              {streamStatus?.fetchIntervalSeconds || 300}s
            </p>
          </div>
        </div>

        {streamStatus?.lastError && (
          <div className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-center gap-2">
            <Info className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Broker telemetry note: {streamStatus.lastError}</span>
          </div>
        )}
      </div>
    </div>
  );
}
export default WeatherExplorer;
