import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, MapPin, Loader2, Clock, Sparkles, Navigation, ArrowRight } from 'lucide-react';
import { useSearchLocations } from '../../hooks/useGeocode';
import { useAppStore, useSearchQuery } from '../../store/useAppStore';
import type { GeocodeResult } from '../../types';

const RECENT_SEARCHES_KEY = 'weatherpulse_recent_searches';
const POPULAR_HUBS = [
  { name: 'New Delhi', state: 'Delhi', coords: { lat: 28.6139, lon: 77.2090 } },
  { name: 'Mumbai', state: 'Maharashtra', coords: { lat: 19.0760, lon: 72.8777 } },
  { name: 'Bengaluru', state: 'Karnataka', coords: { lat: 12.9716, lon: 77.5946 } },
  { name: 'Kolkata', state: 'West Bengal', coords: { lat: 22.5726, lon: 88.3639 } },
  { name: 'Chennai', state: 'Tamil Nadu', coords: { lat: 13.0827, lon: 80.2707 } },
  { name: 'Hyderabad', state: 'Telangana', coords: { lat: 17.3850, lon: 78.4867 } },
  { name: 'Agra', state: 'Uttar Pradesh', coords: { lat: 27.1767, lon: 78.0081 } },
  { name: 'Jaipur', state: 'Rajasthan', coords: { lat: 26.9124, lon: 75.7873 } },
  { name: 'Shimla', state: 'Himachal Pradesh', coords: { lat: 31.1048, lon: 77.1734 } },
  { name: 'Srinagar', state: 'Jammu & Kashmir', coords: { lat: 34.0837, lon: 74.7973 } },
];

export function SearchBar() {
  const storeQuery = useSearchQuery();
  const setSelectedLocation = useAppStore((state) => state.setSelectedLocation);
  const setSearchQuery = useAppStore((state) => state.setSearchQuery);
  const setSearchResults = useAppStore((state) => state.setSearchResults);

  const { search, searchImmediate, clear, results, isLoading, error } = useSearchLocations(storeQuery);

  const [inputValue, setInputValue] = useState(storeQuery);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored).slice(0, 5));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveRecentSearch = (name: string) => {
    try {
      const trimmed = name.trim();
      if (!trimmed) return;
      const updated = [trimmed, ...recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // ignore
    }
  };

  // Sync results with store safely
  useEffect(() => {
    if (results.length > 0) {
      setSearchResults(results);
    }
  }, [results, setSearchResults]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [results]);

  // Global keyboard shortcut: '/' or 'Ctrl+K' to focus search
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.key === '/' && document.activeElement !== inputRef.current) ||
          ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        inputRef.current?.focus();
        setShowResults(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setSearchQuery(val);
    search(val);
    setShowResults(true);
  };

  const selectResult = useCallback((result: GeocodeResult) => {
    const coords = { lat: result.latitude, lon: result.longitude };
    const label = result.name + (result.admin1 ? `, ${result.admin1}` : '');
    saveRecentSearch(result.name);

    setSelectedLocation(coords, label);

    clear();
    setInputValue(result.name);
    setShowResults(false);
    inputRef.current?.blur();
  }, [clear, setSelectedLocation]);

  const selectCityDirect = useCallback((city: { name: string; state?: string; coords: { lat: number; lon: number } }) => {
    const label = city.state ? `${city.name}, ${city.state}` : city.name;
    saveRecentSearch(city.name);
    setSelectedLocation(city.coords, label);
    clear();
    setInputValue(city.name);
    setShowResults(false);
    inputRef.current?.blur();
  }, [clear, setSelectedLocation]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    if (selectedIndex >= 0 && results[selectedIndex]) {
      selectResult(results[selectedIndex]);
      return;
    }

    if (results.length > 0) {
      selectResult(results[0]);
      return;
    }

    // If query typed but debounce hasn't resolved, force immediate search
    searchImmediate(trimmed);
    setShowResults(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!showResults) setShowResults(true);
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setShowResults(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xl mx-auto">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <label htmlFor="meteorological-search" className="sr-only">
          Search Indian city, district, or state
        </label>

        {/* Input Wrapper */}
        <div className="relative w-full flex items-center group">
          <div className="absolute left-3.5 flex items-center pointer-events-none text-dark-400 group-focus-within:text-cyan-400 transition-colors">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </div>

          <input
            ref={inputRef}
            id="meteorological-search"
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowResults(true)}
            placeholder="Search India (e.g. Agra, Delhi, Kerala, Pune)..."
            className="w-full pl-10 pr-20 py-2.5 bg-dark-900/90 hover:bg-dark-900 focus:bg-dark-950 text-white placeholder-dark-400 text-sm rounded-xl border border-white/10 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 shadow-xl backdrop-blur-xl transition-all outline-none"
            autoComplete="off"
            spellCheck="false"
          />

          {/* Right Action Icons (Clear + Submit Button) */}
          <div className="absolute right-1.5 flex items-center gap-1">
            {inputValue && (
              <button
                type="button"
                onClick={() => {
                  clear();
                  setInputValue('');
                  setSearchQuery('');
                  setShowResults(false);
                  inputRef.current?.focus();
                }}
                className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
                title="Clear search"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="submit"
              className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/20 hover:shadow-cyan-500/40 transition-all flex items-center gap-1 active:scale-95"
              title="Search location"
              aria-label="Search"
            >
              <span>Go</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </form>

      {/* Results & Quick-Select Dropdown */}
      {showResults && (
        <div
          role="listbox"
          className="absolute top-full left-0 right-0 mt-2 bg-dark-900/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-2xl overflow-hidden z-50 animate-fade-in divide-y divide-dark-800/60"
        >
          {/* Active Search Results */}
          {inputValue.trim().length > 0 && (
            <div>
              {isLoading && results.length === 0 ? (
                <div className="p-4 flex items-center justify-center gap-2.5 text-dark-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>Searching meteorological registry...</span>
                </div>
              ) : results.length > 0 ? (
                <ul className="max-h-72 overflow-y-auto scrollbar-thin py-1">
                  {results.map((result, idx) => {
                    const isSelected = idx === selectedIndex;
                    const isStateOrAdm1 = result.featureCode === 'ADM1' || (result as any).feature_code === 'ADM1';
                    return (
                      <li
                        key={`${result.latitude}-${result.longitude}-${idx}`}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => selectResult(result)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`px-4 py-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected ? 'bg-cyan-500/15 text-white' : 'text-dark-200 hover:bg-dark-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                            isStateOrAdm1 ? 'bg-indigo-500/20 text-indigo-400' : 'bg-cyan-500/20 text-cyan-400'
                          }`}>
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 truncate">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white text-sm truncate">{result.name}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wider ${
                                isStateOrAdm1 ? 'bg-indigo-500/20 text-indigo-300' : 'bg-cyan-500/20 text-cyan-300'
                              }`}>
                                {isStateOrAdm1 ? 'State' : 'City / District'}
                              </span>
                            </div>
                            <p className="text-dark-400 text-xs truncate">
                              {result.admin1 ? `${result.admin1}, ` : ''}{result.country || 'India'}
                              {result.population && result.population > 0 ? ` • ${formatPop(result.population)} pop` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0 text-dark-500 text-xs pl-2 font-mono">
                          {result.latitude.toFixed(2)}°N, {result.longitude.toFixed(2)}°E
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="p-4 text-center">
                  <p className="text-dark-300 font-medium text-sm">No exact matches for &quot;{inputValue}&quot;</p>
                  <p className="text-dark-500 text-xs mt-1">Try searching by state name, district, or select a popular hub below.</p>
                </div>
              )}
            </div>
          )}

          {/* Recent Searches (if available) */}
          {recentSearches.length > 0 && (
            <div className="p-3 bg-dark-950/40">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 text-xs text-dark-400 font-medium">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  Recent Searches
                </span>
                <button
                  type="button"
                  onClick={clearRecentSearches}
                  className="text-[11px] text-dark-500 hover:text-dark-300 transition-colors"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recentSearches.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => {
                      setInputValue(term);
                      searchImmediate(term);
                      setShowResults(true);
                    }}
                    className="px-2.5 py-1 text-xs rounded-lg bg-dark-800/80 hover:bg-dark-700 text-dark-300 hover:text-white border border-white/5 transition-all flex items-center gap-1"
                  >
                    <span>{term}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick-Jump Popular Indian Meteorological Hubs */}
          <div className="p-3 bg-dark-900/60">
            <div className="flex items-center gap-1.5 text-xs text-dark-400 font-medium mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Popular Indian Meteorological Hubs
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {POPULAR_HUBS.map((hub) => (
                <button
                  key={hub.name}
                  type="button"
                  onClick={() => selectCityDirect(hub)}
                  className="px-2 py-1.5 text-left rounded-lg bg-dark-800/60 hover:bg-cyan-500/20 hover:border-cyan-500/40 border border-white/5 text-dark-300 hover:text-cyan-300 transition-all text-xs truncate flex items-center justify-between group"
                >
                  <span className="truncate">{hub.name}</span>
                  <Navigation className="w-2.5 h-2.5 text-dark-500 group-hover:text-cyan-400 opacity-60 group-hover:opacity-100 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Footer Shortcuts Hint */}
          <div className="px-3 py-1.5 bg-dark-950/80 flex items-center justify-between text-[11px] text-dark-500">
            <div className="flex items-center gap-2">
              <span><kbd className="px-1 py-0.5 rounded bg-dark-800 text-dark-300 border border-dark-700">↑↓</kbd> navigate</span>
              <span><kbd className="px-1 py-0.5 rounded bg-dark-800 text-dark-300 border border-dark-700">↵</kbd> select</span>
              <span><kbd className="px-1 py-0.5 rounded bg-dark-800 text-dark-300 border border-dark-700">esc</kbd> close</span>
            </div>
            <span className="hidden sm:inline">Press <kbd className="px-1 py-0.5 rounded bg-dark-800 text-dark-300 border border-dark-700">/</kbd> anytime to search</span>
          </div>
        </div>
      )}
    </div>
  );
}

function formatPop(pop: number): string {
  if (pop >= 10000000) return `${(pop / 10000000).toFixed(1)}Cr`;
  if (pop >= 100000) return `${(pop / 100000).toFixed(1)}L`;
  if (pop >= 1000) return `${(pop / 1000).toFixed(0)}k`;
  return pop.toString();
}

export default SearchBar;