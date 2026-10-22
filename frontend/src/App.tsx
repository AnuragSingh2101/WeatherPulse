import { useEffect } from 'react';
import { MapContainer } from './components/Map';
import { WeatherDashboard } from './components/Dashboard';
import { SearchBar } from './components/Search';
import { LayerSwitcher } from './components/UI/LayerSwitcher';
import { useAppStore, useNavigationLevel, useSelectedState } from './store/useAppStore';
import { useIndiaOverview as useIndiaOverviewQuery } from './hooks/useWeather';
import { Home, ChevronLeft, Layers, Globe, RotateCw, Loader2, Thermometer, Droplets, AlertTriangle } from 'lucide-react';

function App() {
  const navigationLevel = useNavigationLevel();
  const selectedState = useSelectedState();
  const { setNavigationLevel, setSelectedState, flyToIndia, setIndiaOverview } = useAppStore();
  const { data: indiaOverview, isLoading: overviewLoading } = useIndiaOverviewQuery();

  // Sync overview data to store for map layers & markers
  useEffect(() => {
    if (indiaOverview) {
      setIndiaOverview(indiaOverview);
    }
  }, [indiaOverview, setIndiaOverview]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (navigationLevel !== 'india') {
          flyToIndia();
        }
      }
      if (e.key === 'r' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('refresh-weather'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigationLevel, flyToIndia]);

  return (
    <div className="h-full w-full flex overflow-hidden bg-dark-950 font-sans">
      {/* Main Map Area */}
      <div className="flex-1 relative min-w-0">
        <MapContainer />
        
        {/* Unified Top Navigation Bar */}
        <header className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          {/* Brand & Status */}
          <div className="flex items-center gap-3 pointer-events-auto">
            <div className="glass-panel px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-2xl border border-white/10 backdrop-blur-2xl bg-dark-900/80">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-white font-bold text-base tracking-wide">Weatherpulse</h1>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>
                <p className="text-dark-400 text-xs">India 3D Meteorological Intelligence</p>
              </div>
            </div>
          </div>

          {/* Integrated Search Bar in Header Center */}
          <div className="pointer-events-auto w-full max-w-sm sm:max-w-md mx-auto order-3 lg:order-2">
            <SearchBar />
          </div>

          {/* Right Controls: Layer Switcher & Level Navigation */}
          <div className="flex items-center gap-2 pointer-events-auto order-2 lg:order-3">
            {/* Weather Layer Switcher */}
            <LayerSwitcher />

            {/* Navigation Level Indicator */}
            <div className="glass-panel px-3 py-2 rounded-xl flex items-center gap-2 border border-white/10 bg-dark-900/80">
              <span className="text-dark-400 text-xs uppercase tracking-wider font-semibold">Level</span>
              <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                navigationLevel === 'india' ? 'bg-primary-600/30 text-primary-300 border border-primary-500/30' :
                navigationLevel === 'state' ? 'bg-blue-600/30 text-blue-300 border border-blue-500/30' :
                navigationLevel === 'district' ? 'bg-green-600/30 text-green-300 border border-green-500/30' :
                'bg-purple-600/30 text-purple-300 border border-purple-500/30'
              }`}>
                {navigationLevel.charAt(0).toUpperCase() + navigationLevel.slice(1)}
              </span>
            </div>

            {/* Quick Navigation Buttons */}
            <div className="glass-panel rounded-xl p-1 flex items-center gap-1 border border-white/10 bg-dark-900/80">
              <button
                onClick={flyToIndia}
                className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
                  navigationLevel === 'india'
                    ? 'bg-primary-600/30 text-primary-300'
                    : 'text-dark-400 hover:text-white hover:bg-dark-800/60'
                }`}
                title="India Overview (Esc)"
                aria-label="India Overview"
              >
                <Home className="w-4 h-4" />
              </button>
              {navigationLevel !== 'india' && (
                <button
                  onClick={() => { setNavigationLevel('india'); setSelectedState(null); }}
                  className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800/60 transition-colors"
                  title="Back to India"
                  aria-label="Back to India"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Bottom Status & National Summary Dock */}
        <footer className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none flex justify-center">
          <div className="glass-panel px-4 py-2.5 rounded-2xl max-w-xl w-full mx-auto pointer-events-auto border border-white/10 shadow-2xl backdrop-blur-2xl bg-dark-900/80">
            <div className="flex flex-wrap items-center justify-between text-xs gap-3">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-dark-400">
                  <RotateCw className="w-3.5 h-3.5 text-primary-400" />
                  <span>Click map or state polygon to inspect</span>
                </span>
                {navigationLevel === 'state' && selectedState && (
                  <span className="flex items-center gap-1 text-blue-400 font-medium">
                    <Layers className="w-3.5 h-3.5" />
                    <span>State: {selectedState}</span>
                  </span>
                )}
              </div>

              {/* National Overview Mini-metrics */}
              {indiaOverview?.national ? (
                <div className="flex items-center gap-3 text-dark-300">
                  <span className="flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                    <span>Avg: <strong className="text-white font-semibold">{indiaOverview.national.avgTemperature}°C</strong></span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-blue-400" />
                    <span>{indiaOverview.national.avgHumidity}%</span>
                  </span>
                  {indiaOverview.national.alertCount > 0 && (
                    <span className="flex items-center gap-1 text-red-400 font-semibold px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{indiaOverview.national.alertCount} Alerts</span>
                    </span>
                  )}
                </div>
              ) : overviewLoading ? (
                <div className="flex items-center gap-1.5 text-dark-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-400" />
                  <span>Loading live meteorological telemetry...</span>
                </div>
              ) : null}
            </div>
          </div>
        </footer>
      </div>

      {/* Weather Dashboard - Right Sidebar */}
      <WeatherDashboard />
    </div>
  );
}

export default App;