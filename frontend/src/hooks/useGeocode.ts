import { useState, useEffect, useCallback } from 'react';
import { useQuery } from 'react-query';
import { geocode, type GeocodeResult } from '../services/api';

export function useGeocode(query: string, enabled = true) {
  return useQuery<GeocodeResult[]>(
    ['geocode', query],
    () => geocode(query),
    {
      enabled: enabled && query.length >= 2,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      retry: 1,
    }
  );
}

// Debounced search hook
export function useSearchLocations(initialQuery = '') {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: results, isLoading, error, refetch } = useGeocode(debouncedQuery);

  const search = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  const clear = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
  }, []);

  return {
    query,
    debouncedQuery,
    results: results || [],
    isLoading,
    error,
    search,
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