import { useState, useEffect, useCallback } from 'react';
import { useQuery } from 'react-query';
import { geocode, type GeocodeResult } from '../services/api';

export function useGeocode(query: string, enabled = true) {
  const trimmed = (query || '').trim();
  return useQuery<GeocodeResult[]>(
    ['geocode', trimmed],
    () => geocode(trimmed),
    {
      enabled: enabled && trimmed.length >= 1,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      retry: 1,
      keepPreviousData: false,
    }
  );
}

const EMPTY_RESULTS: GeocodeResult[] = [];

// Debounced search hook with instant search support
export function useSearchLocations(initialQuery = '') {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setDebouncedQuery('');
      return;
    }
    const timer = setTimeout(() => {
      setDebouncedQuery(trimmed);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: results, isLoading, isFetching, error, refetch } = useGeocode(debouncedQuery);

  const search = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  const searchImmediate = useCallback((newQuery: string) => {
    const trimmed = newQuery.trim();
    setQuery(trimmed);
    setDebouncedQuery(trimmed);
  }, []);

  const clear = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
  }, []);

  return {
    query,
    debouncedQuery,
    results: results ?? EMPTY_RESULTS,
    isLoading: isLoading || isFetching,
    error,
    search,
    searchImmediate,
    clear,
    refetch,
  };
}

// Reverse geocoding (coordinates to location name)
export function useReverseGeocode(lat: number, lon: number, enabled = true) {
  return useQuery<GeocodeResult | null>(
    ['reverse-geocode', lat, lon],
    async () => {
      const results = await geocode(`${lat},${lon}`, 1);
      return results[0] || null;
    },
    {
      enabled: enabled && !isNaN(lat) && !isNaN(lon),
      staleTime: 30 * 60 * 1000,
    }
  );
}