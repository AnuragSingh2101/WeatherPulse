import { useEffect } from 'react';
import { MapContainer } from './components/Map';
import { WeatherDashboard } from './components/Dashboard';
import { SearchBar } from './components/Search';
import { useAppStore, useNavigationLevel, useSelectedState } from './store/useAppStore';
import { useIndiaOverview as useIndiaOverviewQuery } from './hooks/useWeather';
import { Home, ChevronLeft, Layers, Globe, RotateCw, Loader2 } from 'lucide-react';

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
        // Close dashboard or reset to India view
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
    <div className="h-full w-full flex overflow-hidden">
      {/* Main Map Area */}
      <div className="flex-1 relative min-w-0">
        <MapContainer />
        
        {/* Top Bar */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary-600/20 flex items-center justify-center">
                <Globe className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <h1 className="text-white font-semibold text-lg">India Weather Map</h1>
                <p className="text-dark-400 text-xs">Interactive 3D weather visualization</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Navigation Level Indicator */}
            <div className="glass-panel px-3 py-2 rounded-xl flex items-center gap-2">
              <span className="text-dark-400 text-sm">Level:</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                navigationLevel === 'india' ? 'bg-primary-600/20 text-primary-400' :
                navigationLevel === 'state' ? 'bg-blue-600/20 text-blue-400' :
                navigationLevel === 'district' ? 'bg-green-600/20 text-green-400' :
                'bg-purple-600/20 text-purple-400'
              }`}>
                {navigationLevel.charAt(0).toUpperCase() + navigationLevel.slice(1)}
              </span>
            </div>

            {/* Quick Navigation Buttons */}
            <div className="glass-panel rounded-xl p-1 flex items-center gap-1">
              <button
                onClick={flyToIndia}
                className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
                  navigationLevel === 'india'
                    ? 'bg-primary-600/20 text-primary-400'
                    : 'text-dark-400 hover:text-white hover:bg-dark-800/50'
                }`}
                title="India Overview (Esc)"
                aria-label="India Overview"
              >
                <Home className="w-5 h-5" />
              </button>
              {navigationLevel !== 'india' && (
                <button
                  onClick={() => { setNavigationLevel('india'); setSelectedState(null); }}
                  className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800/50 transition-colors"
                  title="Back to India"
                  aria-label="Back to India"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Search Bar - Top Right */}
        <div className="absolute top-4 right-4 z-20 w-80 pointer-events-auto">
          <SearchBar />
        </div>

        {/* Bottom Status Bar */}
        <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none">
          <div className="glass-panel px-4 py-2 rounded-xl max-w-md mx-auto pointer-events-auto">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1 text-dark-400">
                  <RotateCw className="w-4 h-4" />
                  <span>Click anywhere for weather</span>
                </span>
                {navigationLevel === 'state' && selectedState && (
                  <span className="flex items-center gap-1 text-blue-400">
                    <Layers className="w-4 h-4" />
                    <span>State: {selectedState}</span>
                  </span>
                )}
              </div>
              {overviewLoading && (
                <div className="flex items-center gap-1 text-dark-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading overview...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Weather Dashboard - Right Sidebar */}
      <WeatherDashboard />
    </div>
  );
}

export default App;