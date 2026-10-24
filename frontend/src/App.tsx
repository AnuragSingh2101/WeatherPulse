import { useState, useEffect } from 'react';
import { MapContainer } from './components/Map';
import { WeatherDashboard } from './components/Dashboard';
import { SearchBar } from './components/Search';
import { LayerSwitcher } from './components/UI/LayerSwitcher';
import { WeatherCompareModal } from './components/UI/WeatherCompareModal';
import { AlertAdvisoryModal } from './components/UI/AlertAdvisoryModal';
import { DemoTourController } from './components/UI/DemoTourController';
import { WeatherExplorerModal } from './components/UI/WeatherExplorerModal';
import { useAppStore, useNavigationLevel, useSelectedState } from './store/useAppStore';
import { useIndiaOverview as useIndiaOverviewQuery } from './hooks/useWeather';
import {
  Home,
  ChevronLeft,
  Layers,
  Globe,
  RotateCw,
  Loader2,
  Thermometer,
  Droplets,
  AlertTriangle,
  ArrowRightLeft,
  Sparkles,
  ShieldAlert,
  Radio,
} from 'lucide-react';

function App() {
  const navigationLevel = useNavigationLevel();
  const selectedState = useSelectedState();
  const { setNavigationLevel, setSelectedState, flyToIndia, setIndiaOverview } = useAppStore();
  const { data: indiaOverview, isLoading: overviewLoading } = useIndiaOverviewQuery();

  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
  const [isTourActive, setIsTourActive] = useState(false);
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);

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
        if (isExplorerOpen) setIsExplorerOpen(false);
        else if (isCompareOpen) setIsCompareOpen(false);
        else if (isAlertsModalOpen) setIsAlertsModalOpen(false);
        else if (isTourActive) setIsTourActive(false);
        else if (navigationLevel !== 'india') flyToIndia();
      }
      if (e.key === 'r' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('refresh-weather'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigationLevel, flyToIndia, isCompareOpen, isAlertsModalOpen, isTourActive, isExplorerOpen]);

  const nationalAvgTemp = indiaOverview?.national?.avgTemperature ?? (indiaOverview?.national as any)?.avg_temperature ?? 27.5;
  const nationalAvgHumidity = indiaOverview?.national?.avgHumidity ?? (indiaOverview?.national as any)?.avg_humidity ?? 62;
  const nationalAlertCount = indiaOverview?.national?.alertCount ?? (indiaOverview?.national as any)?.alert_count ?? 0;

  return (
    <div className="h-full w-full flex overflow-hidden bg-dark-950 font-sans select-none">
      {/* Main Map Area */}
      <div className="flex-1 relative min-w-0">
        <MapContainer />

        {/* Unified Top Navigation Bar */}
        <header className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          {/* Brand & Live Telemetry Pill */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="glass-panel px-3.5 py-2 rounded-2xl flex items-center gap-3 shadow-2xl border border-white/10 backdrop-blur-2xl bg-dark-900/85">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Globe className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-white font-bold text-sm tracking-wide">Weatherpulse</h1>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>
                <p className="text-dark-400 text-[10px] leading-tight">India 3D Meteorological Intelligence</p>
              </div>
            </div>
          </div>

          {/* Integrated Search Bar in Header Center */}
          <div className="pointer-events-auto w-full max-w-sm sm:max-w-md mx-auto order-3 lg:order-2">
            <SearchBar />
          </div>

          {/* Right Controls & Feature Action Buttons */}
          <div className="flex items-center gap-1.5 pointer-events-auto order-2 lg:order-3">
            {/* Weather Explorer Button */}
            <button
              onClick={() => setIsExplorerOpen(true)}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-600/30 to-blue-600/30 hover:from-cyan-600/50 hover:to-blue-600/50 border border-cyan-400/40 text-cyan-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg active:scale-95"
              title="Interactive Weather Location Selection, Leaflet Map & Kafka Ingestion"
            >
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="hidden sm:inline">Weather Explorer</span>
            </button>

            {/* Live Presentation Tour Preset Button */}
            <button
              onClick={() => setIsTourActive(!isTourActive)}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg active:scale-95 ${
                isTourActive
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-400/50 shadow-orange-500/20'
                  : 'bg-dark-900/85 hover:bg-dark-800 text-amber-300 hover:text-white border-white/10'
              }`}
              title="Start Live Presentation Tour"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="hidden sm:inline">Demo Tour</span>
            </button>

            {/* Dual City Compare Button */}
            <button
              onClick={() => setIsCompareOpen(true)}
              className="px-3 py-2 rounded-xl bg-dark-900/85 hover:bg-dark-800 border border-white/10 text-cyan-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg active:scale-95"
              title="Compare Weather Between 2 Indian Cities"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Compare</span>
            </button>

            {/* National Alerts Advisory Button */}
            <button
              onClick={() => setIsAlertsModalOpen(true)}
              className="px-2.5 py-2 rounded-xl bg-dark-900/85 hover:bg-dark-800 border border-white/10 text-red-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg active:scale-95"
              title="View Active Nationwide Meteorological Advisories"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Advisories</span>
            </button>

            {/* Weather Layer Switcher (Temp, Rain, Wind, Alerts) */}
            <LayerSwitcher />

            {/* Navigation Level Indicator */}
            <div className="glass-panel px-2.5 py-2 rounded-xl flex items-center gap-1.5 border border-white/10 bg-dark-900/85 text-xs">
              <span className="text-dark-400 text-[10px] uppercase font-bold tracking-wider">Level</span>
              <span
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                  navigationLevel === 'india'
                    ? 'bg-primary-600/30 text-primary-300 border border-primary-500/30'
                    : navigationLevel === 'state'
                    ? 'bg-blue-600/30 text-blue-300 border border-blue-500/30'
                    : navigationLevel === 'district'
                    ? 'bg-green-600/30 text-green-300 border border-green-500/30'
                    : 'bg-purple-600/30 text-purple-300 border border-purple-500/30'
                }`}
              >
                {navigationLevel.charAt(0).toUpperCase() + navigationLevel.slice(1)}
              </span>
            </div>

            {/* Home / Reset View */}
            <button
              onClick={flyToIndia}
              className={`p-2 rounded-xl border border-white/10 transition-all flex items-center justify-center active:scale-95 ${
                navigationLevel === 'india'
                  ? 'bg-primary-600/30 text-primary-300 border-primary-500/40'
                  : 'bg-dark-900/85 text-dark-400 hover:text-white hover:bg-dark-800'
              }`}
              title="Return to National Overview (Esc)"
              aria-label="National Overview"
            >
              <Home className="w-4 h-4" />
            </button>
            {navigationLevel !== 'india' && (
              <button
                onClick={() => {
                  setNavigationLevel('india');
                  setSelectedState(null);
                }}
                className="p-2 rounded-xl bg-dark-900/85 border border-white/10 text-dark-400 hover:text-white hover:bg-dark-800 transition-all"
                title="Back to India"
                aria-label="Back to India"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* Bottom Status & National Summary Dock */}
        <footer className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none flex justify-center">
          <div className="glass-panel px-4 py-2 rounded-2xl max-w-2xl w-full mx-auto pointer-events-auto border border-white/10 shadow-2xl backdrop-blur-2xl bg-dark-900/85">
            <div className="flex flex-wrap items-center justify-between text-xs gap-3">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-dark-400">
                  <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Click any state polygon to inspect</span>
                </span>
                {navigationLevel === 'state' && selectedState && (
                  <span className="flex items-center gap-1 text-cyan-400 font-semibold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                    <Layers className="w-3 h-3" />
                    <span>State: {selectedState}</span>
                  </span>
                )}
              </div>

              {/* National Overview Metrics */}
              {indiaOverview?.national ? (
                <div className="flex items-center gap-3 text-dark-300 font-medium">
                  <span className="flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      Avg Temp: <strong className="text-white font-bold">{Math.round(nationalAvgTemp)}°C</strong>
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-blue-400" />
                    <span>
                      Humidity: <strong className="text-white font-bold">{nationalAvgHumidity}%</strong>
                    </span>
                  </span>
                  <button
                    onClick={() => setIsAlertsModalOpen(true)}
                    className="flex items-center gap-1 text-red-400 font-semibold px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 hover:bg-red-500/30 transition-all"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    <span>{nationalAlertCount > 0 ? `${nationalAlertCount} Active Alerts` : 'Advisories'}</span>
                  </button>
                </div>
              ) : overviewLoading ? (
                <div className="flex items-center gap-1.5 text-dark-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  <span>Synchronizing nationwide meteorological telemetry...</span>
                </div>
              ) : null}
            </div>
          </div>
        </footer>
      </div>

      {/* Weather Dashboard - Right Drawer */}
      <WeatherDashboard />

      {/* Feature Modals */}
      <WeatherExplorerModal isOpen={isExplorerOpen} onClose={() => setIsExplorerOpen(false)} />
      <WeatherCompareModal isOpen={isCompareOpen} onClose={() => setIsCompareOpen(false)} />
      <AlertAdvisoryModal isOpen={isAlertsModalOpen} onClose={() => setIsAlertsModalOpen(false)} />
      <DemoTourController isActive={isTourActive} onClose={() => setIsTourActive(false)} />
    </div>
  );
}

export default App;