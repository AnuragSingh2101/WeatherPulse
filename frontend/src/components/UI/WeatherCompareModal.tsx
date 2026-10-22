import { useState, useEffect } from 'react';
import { X, ArrowRightLeft, Thermometer, Droplets, Wind, Gauge, Sun, MapPin, Loader2, Navigation } from 'lucide-react';
import { getCurrentWeather } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';
import type { CurrentWeather, Coordinates } from '../../types';

interface CityOption {
  name: string;
  state: string;
  coords: Coordinates;
}

const PRESET_CITIES: CityOption[] = [
  { name: 'New Delhi', state: 'Delhi', coords: { lat: 28.6139, lon: 77.2090 } },
  { name: 'Mumbai', state: 'Maharashtra', coords: { lat: 19.0760, lon: 72.8777 } },
  { name: 'Bengaluru', state: 'Karnataka', coords: { lat: 12.9716, lon: 77.5946 } },
  { name: 'Kolkata', state: 'West Bengal', coords: { lat: 22.5726, lon: 88.3639 } },
  { name: 'Chennai', state: 'Tamil Nadu', coords: { lat: 13.0827, lon: 80.2707 } },
  { name: 'Agra', state: 'Uttar Pradesh', coords: { lat: 27.1767, lon: 78.0081 } },
  { name: 'Jaipur', state: 'Rajasthan', coords: { lat: 26.9124, lon: 75.7873 } },
  { name: 'Shimla', state: 'Himachal Pradesh', coords: { lat: 31.1048, lon: 77.1734 } },
  { name: 'Srinagar', state: 'Jammu & Kashmir', coords: { lat: 34.0837, lon: 74.7973 } },
  { name: 'Hyderabad', state: 'Telangana', coords: { lat: 17.3850, lon: 78.4867 } },
];

interface WeatherCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WeatherCompareModal({ isOpen, onClose }: WeatherCompareModalProps) {
  const selectedLocation = useAppStore((state) => state.selectedLocation);
  const selectedLocationName = useAppStore((state) => state.selectedLocationName);
  const setSelectedLocation = useAppStore((state) => state.setSelectedLocation);

  const [cityA, setCityA] = useState<CityOption>(PRESET_CITIES[0]);
  const [cityB, setCityB] = useState<CityOption>(PRESET_CITIES[1]);

  const [weatherA, setWeatherA] = useState<CurrentWeather | null>(null);
  const [weatherB, setWeatherB] = useState<CurrentWeather | null>(null);
  const [loading, setLoading] = useState(false);

  // If user opened with an active location, use it as City A
  useEffect(() => {
    if (selectedLocation && selectedLocationName) {
      setCityA({
        name: selectedLocationName.split(',')[0],
        state: selectedLocationName.split(',')[1]?.trim() || 'India',
        coords: selectedLocation,
      });
    }
  }, [selectedLocation, selectedLocationName]);

  // Fetch weather for both cities
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);

    Promise.all([
      getCurrentWeather(cityA.coords.lat, cityA.coords.lon).catch(() => null),
      getCurrentWeather(cityB.coords.lat, cityB.coords.lon).catch(() => null),
    ]).then(([resA, resB]) => {
      if (isMounted) {
        setWeatherA(resA);
        setWeatherB(resB);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, cityA, cityB]);

  if (!isOpen) return null;

  const tempDiff = weatherA && weatherB ? Math.round((weatherA.temperature - weatherB.temperature) * 10) / 10 : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-dark-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-dark-800 flex items-center justify-between bg-dark-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base">Dual-City Meteorological Comparison</h3>
              <p className="text-dark-400 text-xs">Compare real-time temperature, humidity, and atmospheric telemetry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
            aria-label="Close comparison"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* City Selectors */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-dark-800/80 bg-dark-900/40">
          <div>
            <label className="block text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1.5">
              Location A
            </label>
            <select
              value={cityA.name}
              onChange={(e) => {
                const found = PRESET_CITIES.find((c) => c.name === e.target.value);
                if (found) setCityA(found);
              }}
              className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-xl text-white text-sm focus:border-cyan-500 focus:outline-none"
            >
              {PRESET_CITIES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.state})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1.5">
              Location B
            </label>
            <select
              value={cityB.name}
              onChange={(e) => {
                const found = PRESET_CITIES.find((c) => c.name === e.target.value);
                if (found) setCityB(found);
              }}
              className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-xl text-white text-sm focus:border-amber-500 focus:outline-none"
            >
              {PRESET_CITIES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.state})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Comparison Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-dark-400">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
              <p className="text-sm">Fetching synchronized meteorological telemetry...</p>
            </div>
          ) : weatherA && weatherB ? (
            <>
              {/* Highlight summary card */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 via-dark-800/40 to-amber-950/40 border border-white/10 text-center">
                <span className="text-xs uppercase tracking-wider text-dark-400 font-semibold">Variance Analysis</span>
                <p className="text-sm text-dark-200 mt-1">
                  {tempDiff !== null && tempDiff > 0 ? (
                    <span>
                      <strong className="text-cyan-400 font-bold">{cityA.name}</strong> is{' '}
                      <strong className="text-white font-bold">{tempDiff}°C warmer</strong> than{' '}
                      <strong className="text-amber-400 font-bold">{cityB.name}</strong>.
                    </span>
                  ) : tempDiff !== null && tempDiff < 0 ? (
                    <span>
                      <strong className="text-cyan-400 font-bold">{cityA.name}</strong> is{' '}
                      <strong className="text-white font-bold">{Math.abs(tempDiff)}°C cooler</strong> than{' '}
                      <strong className="text-amber-400 font-bold">{cityB.name}</strong>.
                    </span>
                  ) : (
                    <span>Both locations currently experience equivalent ambient temperatures.</span>
                  )}
                </p>
              </div>

              {/* Side-by-side metric cards */}
              <div className="grid grid-cols-2 gap-4">
                {/* City A Panel */}
                <div className="p-4 rounded-2xl bg-dark-800/50 border border-cyan-500/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-bold text-lg">{cityA.name}</h4>
                      <p className="text-cyan-400 text-xs">{cityA.state}</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedLocation(cityA.coords, `${cityA.name}, ${cityA.state}`);
                        onClose();
                      }}
                      className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500 hover:text-white transition-all text-xs flex items-center gap-1"
                      title="Fly map to location"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Fly</span>
                    </button>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-white tabular-nums">
                      {Math.round(weatherA.temperature)}°C
                    </span>
                    <span className="text-xs text-dark-400">
                      Feels {Math.round(weatherA.feelsLike ?? (weatherA as any).feels_like ?? weatherA.temperature)}°C
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-dark-300">
                      <span className="flex items-center gap-1.5"><Droplets className="w-3.5 h-3.5 text-blue-400" /> Humidity</span>
                      <strong className="text-white font-semibold">{weatherA.humidity}%</strong>
                    </div>
                    <div className="flex items-center justify-between text-dark-300">
                      <span className="flex items-center gap-1.5"><Wind className="w-3.5 h-3.5 text-emerald-400" /> Wind</span>
                      <strong className="text-white font-semibold">
                        {Math.round(weatherA.windSpeed ?? (weatherA as any).wind_speed ?? 0)} km/h {weatherA.windDirectionText ?? (weatherA as any).wind_direction_text ?? ''}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-dark-300">
                      <span className="flex items-center gap-1.5"><Gauge className="w-3.5 h-3.5 text-amber-400" /> Pressure</span>
                      <strong className="text-white font-semibold">{weatherA.pressure} hPa</strong>
                    </div>
                    <div className="flex items-center justify-between text-dark-300">
                      <span className="flex items-center gap-1.5"><Sun className="w-3.5 h-3.5 text-yellow-400" /> Condition</span>
                      <strong className="text-white font-semibold truncate max-w-[120px]">
                        {weatherA.weatherDescription ?? (weatherA as any).weather_description ?? 'Fair'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* City B Panel */}
                <div className="p-4 rounded-2xl bg-dark-800/50 border border-amber-500/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-bold text-lg">{cityB.name}</h4>
                      <p className="text-amber-400 text-xs">{cityB.state}</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedLocation(cityB.coords, `${cityB.name}, ${cityB.state}`);
                        onClose();
                      }}
                      className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-white transition-all text-xs flex items-center gap-1"
                      title="Fly map to location"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Fly</span>
                    </button>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-white tabular-nums">
                      {Math.round(weatherB.temperature)}°C
                    </span>
                    <span className="text-xs text-dark-400">
                      Feels {Math.round(weatherB.feelsLike ?? (weatherB as any).feels_like ?? weatherB.temperature)}°C
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-dark-300">
                      <span className="flex items-center gap-1.5"><Droplets className="w-3.5 h-3.5 text-blue-400" /> Humidity</span>
                      <strong className="text-white font-semibold">{weatherB.humidity}%</strong>
                    </div>
                    <div className="flex items-center justify-between text-dark-300">
                      <span className="flex items-center gap-1.5"><Wind className="w-3.5 h-3.5 text-emerald-400" /> Wind</span>
                      <strong className="text-white font-semibold">
                        {Math.round(weatherB.windSpeed ?? (weatherB as any).wind_speed ?? 0)} km/h {weatherB.windDirectionText ?? (weatherB as any).wind_direction_text ?? ''}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-dark-300">
                      <span className="flex items-center gap-1.5"><Gauge className="w-3.5 h-3.5 text-amber-400" /> Pressure</span>
                      <strong className="text-white font-semibold">{weatherB.pressure} hPa</strong>
                    </div>
                    <div className="flex items-center justify-between text-dark-300">
                      <span className="flex items-center gap-1.5"><Sun className="w-3.5 h-3.5 text-yellow-400" /> Condition</span>
                      <strong className="text-white font-semibold truncate max-w-[120px]">
                        {weatherB.weatherDescription ?? (weatherB as any).weather_description ?? 'Fair'}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-dark-400 text-sm">
              Unable to load comparison telemetry. Please try selecting different locations.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WeatherCompareModal;
