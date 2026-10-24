import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, RefreshCw, Loader2, AlertTriangle, Info, Download } from 'lucide-react';
import { useAppStore, useIsDashboardOpen, useSelectedLocationName, useSelectedLocation, useWeatherData } from '../../store/useAppStore';
import { useDashboardData } from '../../hooks/useWeather';
import { CurrentConditions } from './CurrentConditions';
import { Forecast } from './Forecast';
import { HistoricalCharts } from './HistoricalCharts';
import { Alerts } from './Alerts';
import { DataFreshness } from './DataFreshness';
import { WeatherExplorer } from '../WeatherExplorer';
import type { WeatherDashboardData } from '../../types';

export function WeatherDashboard() {
  const isOpen = useIsDashboardOpen();
  const locationName = useSelectedLocationName();
  const selectedLocation = useSelectedLocation();
  const storeWeatherData = useWeatherData();
  const setWeatherData = useAppStore((state) => state.setWeatherData);
  const closeDashboard = useAppStore((state) => state.toggleDashboard);
  const [activeTab, setActiveTab] = useState<'current' | 'forecast' | 'historical' | 'alerts' | 'explorer'>('current');

  const { data: fetchedData, isLoading, error, refetch } = useDashboardData(selectedLocation, locationName, isOpen);

  useEffect(() => {
    if (fetchedData) {
      setWeatherData(fetchedData);
    }
  }, [fetchedData, setWeatherData]);

  useEffect(() => {
    const handleRefresh = () => {
      refetch();
    };
    window.addEventListener('refresh-weather', handleRefresh);
    return () => window.removeEventListener('refresh-weather', handleRefresh);
  }, [refetch]);

  const weatherData = fetchedData || storeWeatherData;

  const exportWeatherData = (format: 'csv' | 'json') => {
    if (!weatherData) return;
    const loc = (locationName || 'location').replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = new Date().toISOString().split('T')[0];

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(weatherData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `WeatherPulse_${loc}_${timestamp}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const headers = ['Time', 'Temperature_C', 'FeelsLike_C', 'Humidity_pct', 'WindSpeed_kmh', 'Condition', 'Precipitation_mm'];
      const rows = (weatherData.hourly || []).map((h) => [
        h.time,
        h.temperature,
        h.feelsLike ?? (h as any).feels_like ?? h.temperature,
        h.humidity,
        h.windSpeed ?? (h as any).wind_speed ?? 0,
        `"${h.weatherDescription ?? (h as any).weather_description ?? 'Fair'}"`,
        h.precipitation ?? 0,
      ]);
      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `WeatherPulse_${loc}_Hourly_${timestamp}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (!isOpen) return null;

  const isActuallyLoading = isLoading && !weatherData;

  const tabs = [
    { id: 'explorer', label: 'Weather Explorer', icon: null },
    { id: 'current', label: 'Current', icon: null },
    { id: 'forecast', label: 'Forecast', icon: null },
    { id: 'historical', label: 'History', icon: null },
    { id: 'alerts', label: 'Alerts', icon: null, count: weatherData?.alerts?.length || 0 },
  ];

  return (
    <div className="fixed right-0 top-0 h-full w-full max-w-xl z-50 animate-slide-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[-1]"
        onClick={() => closeDashboard(false)}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="h-full glass-panel flex flex-col border-l border-dark-700/50">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-700/50">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-lg bg-primary-600/20 flex items-center justify-center flex-shrink-0">
              <span className="text-primary-400 text-lg font-semibold">
                {locationName?.charAt(0).toUpperCase() || '📍'}
              </span>
            </div>
            <div className="min-w-0">
              <h2 className="text-white font-semibold truncate">{locationName || 'Weather Details'}</h2>
              <p className="text-dark-400 text-sm truncate">Live weather & historical analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Export CSV Button */}
            {weatherData && (
              <button
                onClick={() => exportWeatherData('csv')}
                className="px-2.5 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-cyan-300 border border-white/5 transition-all flex items-center gap-1.5 text-xs font-medium"
                title="Export 48h Hourly Forecast to CSV"
                aria-label="Export to CSV"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            )}
            <button
              onClick={() => refetch()}
              className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-white transition-colors"
              aria-label="Refresh weather data"
              title="Refresh Telemetry"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => closeDashboard(false)}
              className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-white transition-colors"
              aria-label="Close dashboard"
              title="Close Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-dark-700/50 overflow-x-auto px-2 pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30'
                  : 'text-dark-400 hover:text-dark-200 hover:bg-dark-800/50'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 text-xs flex items-center justify-center">
                  {tab.count > 9 ? '9+' : tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
          {isActuallyLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
              <p className="text-dark-400">Loading weather data...</p>
              <p className="text-dark-500 text-sm">Fetching latest conditions</p>
            </div>
          ) : error && !weatherData ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-center px-4">
              <AlertTriangle className="w-12 h-12 text-yellow-500" />
              <h3 className="text-white font-semibold">Unable to load weather data</h3>
              <p className="text-dark-400 text-sm">{error instanceof Error ? error.message : 'Error fetching data'}</p>
              <button
                onClick={() => refetch()}
                className="btn-primary mt-2"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              {activeTab === 'explorer' && <WeatherExplorer />}
              {activeTab === 'current' && <CurrentConditions data={weatherData} />}
              {activeTab === 'forecast' && <Forecast data={weatherData} />}
              {activeTab === 'historical' && <HistoricalCharts data={weatherData} />}
              {activeTab === 'alerts' && <Alerts data={weatherData} />}
            </>
          )}

          {/* Data Freshness - always shown at bottom */}
          {weatherData && <DataFreshness data={weatherData} />}
        </div>
      </div>
    </div>
  );
}

export default WeatherDashboard;