import { useEffect, useRef, useCallback } from 'react';
import maplibregl, { Map, LngLatLike, MapMouseEvent, GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useAppStore, useViewport, useSelectedLocation, useNavigationLevel, useSelectedState, useWeatherData, useIndiaOverview, useStateDistricts } from '../../store/useAppStore';
import type { Coordinates, MapViewport } from '../../types';
import type { LayerSpecification } from 'maplibre-gl';
import {
  createStateLayers,
  createDistrictLayers,
  createWeatherMarkerLayers,
  createSelectedLocationLayer,
  createSelectedLocationPulseLayer,
  MAP_STYLE,
  getStateBounds,
} from '../../services/mapUtils';

// Import India states GeoJSON
import { indiaStatesGeoJSON } from '../../assets/geojson/india-states';

interface MapContainerProps {
  onMapLoad?: (map: Map) => void;
  onMapClick?: (coords: Coordinates) => void;
}

export function MapContainer({ onMapLoad, onMapClick }: MapContainerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isMapLoaded = useRef(false);

  // Store selectors
  const viewport = useViewport();
  const selectedLocation = useSelectedLocation();
  const navigationLevel = useNavigationLevel();
  const selectedState = useSelectedState();
  const setViewport = useAppStore((state) => state.setViewport);
  const setSelectedLocation = useAppStore((state) => state.setSelectedLocation);

  // Data from store
  const indiaOverview = useIndiaOverview();
  const stateDistricts = useStateDistricts();
  const weatherData = useWeatherData();

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || isMapLoaded.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE as maplibregl.StyleSpecification,
      center: [viewport.center.lon, viewport.center.lat] as LngLatLike,
      zoom: viewport.zoom,
      bearing: viewport.bearing,
      pitch: viewport.pitch,
      antialias: true,
      preserveDrawingBuffer: true,
    });

    mapRef.current = map;

    map.on('load', () => {
      isMapLoaded.current = true;
      setupMapSources(map);
      setupMapLayers(map);
      setupMapEvents(map);
      onMapLoad?.(map);
    });

    map.on('style.load', () => {
      if (isMapLoaded.current) {
        setupMapSources(map);
        setupMapLayers(map);
      }
    });

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      map.remove();
      mapRef.current = null;
      isMapLoaded.current = false;
    };
  }, []);

  // Setup data sources
  const setupMapSources = useCallback((map: Map) => {
    // States source
    if (!map.getSource('states')) {
      map.addSource('states', {
        type: 'geojson',
        data: indiaStatesGeoJSON,
        generateId: true,
      });
    }

    // Districts source (empty initially, loaded on demand)
    if (!map.getSource('districts')) {
      map.addSource('districts', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
    }

    // Weather markers source
    if (!map.getSource('weather-markers')) {
      map.addSource('weather-markers', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
    }

    // Selected location source
    if (!map.getSource('selected-location')) {
      map.addSource('selected-location', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
    }
  }, []);

  // Setup map layers
  const setupMapLayers = useCallback((map: Map) => {
    // Add state layers
    const stateLayers = createStateLayers(indiaStatesGeoJSON as GeoJSON.FeatureCollection);
    stateLayers.forEach((layer) => {
      if (!map.getLayer(layer.id)) {
        map.addLayer(layer);
      }
    });

    // Add district layers
    const districtLayers = createDistrictLayers({ type: 'FeatureCollection', features: [] } as GeoJSON.FeatureCollection);
    districtLayers.forEach((layer) => {
      if (!map.getLayer(layer.id)) {
        map.addLayer(layer);
      }
    });

    // Add weather marker layers
    const markerLayers = createWeatherMarkerLayers();
    markerLayers.forEach((layer) => {
      if (!map.getLayer(layer.id)) {
        map.addLayer(layer);
      }
    });

    // Add selected location layers
    const selectedLayer = createSelectedLocationLayer();
    if (!map.getLayer(selectedLayer.id)) {
      map.addLayer(selectedLayer);
    }

    const pulseLayer = createSelectedLocationPulseLayer();
    if (!map.getLayer(pulseLayer.id)) {
      map.addLayer(pulseLayer);
    }
  }, []);

  // Setup map events
  const setupMapEvents = useCallback((map: Map) => {
    // Click on map
    map.on('click', (e: MapMouseEvent) => {
      const coords: Coordinates = {
        lat: e.lngLat.lat,
        lon: e.lngLat.lng,
      };

      // Check if clicked on a state polygon
      const stateFeatures = map.queryRenderedFeatures(e.point, { layers: ['states-fill-extrusion'] });
      if (stateFeatures.length > 0 && navigationLevel === 'india') {
        const stateCode = stateFeatures[0].properties?.code as string;
        if (stateCode) {
          handleStateClick(map, stateCode);
          return;
        }
      }

      // Check if clicked on a district polygon
      const districtFeatures = map.queryRenderedFeatures(e.point, { layers: ['districts-fill'] });
      if (districtFeatures.length > 0 && navigationLevel === 'state' && selectedState) {
        const districtCode = districtFeatures[0].properties?.code as string;
        if (districtCode) {
          handleDistrictClick(map, selectedState, districtCode);
          return;
        }
      }

      // Check if clicked on a weather marker
      const markerFeatures = map.queryRenderedFeatures(e.point, { layers: ['weather-markers'] });
      if (markerFeatures.length > 0) {
        const geometry = markerFeatures[0].geometry;
        if (geometry.type === 'Point') {
          const coords = geometry.coordinates;
          const markerCoords: [number, number] = [coords[0], coords[1]];
          const name = markerFeatures[0].properties?.name as string;
          handleMarkerClick(map, { lat: markerCoords[1], lon: markerCoords[0] }, name);
          return;
        }
      }

      // Default: click anywhere on map
      if (onMapClick) {
        onMapClick(coords);
      } else {
        setSelectedLocation(coords, `${coords.lat.toFixed(2)}°N, ${coords.lon.toFixed(2)}°E`);
      }
    });

    // Hover effects
    map.on('mousemove', (e: MapMouseEvent) => {
      const stateFeatures = map.queryRenderedFeatures(e.point, { layers: ['states-fill-extrusion'] });
      map.getCanvas().style.cursor = stateFeatures.length > 0 ? 'pointer' : '';

      const districtFeatures = map.queryRenderedFeatures(e.point, { layers: ['districts-fill'] });
      if (districtFeatures.length > 0) {
        map.getCanvas().style.cursor = 'pointer';
      }

      const markerFeatures = map.queryRenderedFeatures(e.point, { layers: ['weather-markers'] });
      if (markerFeatures.length > 0) {
        map.getCanvas().style.cursor = 'pointer';
      }
    });

    // Viewport change
    map.on('moveend', () => {
      const center = map.getCenter();
      setViewport({
        center: { lat: center.lat, lon: center.lng },
        zoom: map.getZoom(),
        bearing: map.getBearing(),
        pitch: map.getPitch(),
      });
    });
  }, [navigationLevel, selectedState, setViewport, onMapClick]);

  // Handle state click
  const handleStateClick = useCallback((map: Map, stateCode: string) => {
    const bounds = getStateBounds(stateCode);
    if (bounds) {
      map.fitBounds([
        [bounds.bounds.minLon, bounds.bounds.minLat],
        [bounds.bounds.maxLon, bounds.bounds.maxLat],
      ], { padding: 50, duration: 1000 });
      setSelectedLocation(bounds.center, `${stateCode} State`);
    }
    useAppStore.getState().setNavigationLevel('state');
    useAppStore.getState().setSelectedState(stateCode);
    useAppStore.getState().setSelectedDistrict(null);
  }, [setSelectedLocation]);

  // Handle district click
  const handleDistrictClick = useCallback((map: Map, stateCode: string, districtCode: string) => {
    // Would fly to district bounds
    useAppStore.getState().setNavigationLevel('district');
    useAppStore.getState().setSelectedDistrict(districtCode);
  }, []);

  // Handle marker click
  const handleMarkerClick = useCallback((map: Map, coords: Coordinates, name: string) => {
    map.flyTo({ center: [coords.lon, coords.lat], zoom: 9, duration: 1000 });
    setSelectedLocation(coords, name);
    useAppStore.getState().setNavigationLevel('city');
  }, [setSelectedLocation]);

  // Update viewport when store changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded.current) return;

    const currentCenter = map.getCenter();
    const targetCenter: [number, number] = [viewport.center.lon, viewport.center.lat];

    // Only animate if significant difference
    const distance = Math.hypot(currentCenter.lng - targetCenter[0], currentCenter.lat - targetCenter[1]);
    if (distance > 0.01) {
      map.flyTo({
        center: targetCenter,
        zoom: viewport.zoom,
        bearing: viewport.bearing,
        pitch: viewport.pitch,
        duration: 1500,
      });
    }
  }, [viewport]);

  // Update weather markers when data changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded.current) return;

    const source = map.getSource('weather-markers') as maplibregl.GeoJSONSource;
    if (!source) return;

    const features: GeoJSON.Feature[] = [];

    // Add markers from India overview (state capitals/major cities)
    if (indiaOverview?.states) {
      indiaOverview.states.forEach((state: typeof indiaOverview.states[0]) => {
        if (state.current) {
          features.push({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [state.center.lon, state.center.lat] },
            properties: {
              name: state.name,
              temperature: state.current.temperature,
              type: 'state-capital',
            },
          });
        }
      });
    }

    // Add markers from state districts
    if (stateDistricts) {
      stateDistricts.forEach((district: typeof stateDistricts[0]) => {
        if (district.current) {
          features.push({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [district.center.lon, district.center.lat] },
            properties: {
              name: district.name,
              temperature: district.current.temperature,
              type: 'district',
            },
          });
        }
      });
    }

    // Add selected location marker
    if (selectedLocation && weatherData?.current) {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [selectedLocation.lon, selectedLocation.lat] },
        properties: {
          name: weatherData.locationName,
          temperature: weatherData.current.temperature,
          type: 'selected',
        },
      });
    }

    source.setData({ type: 'FeatureCollection', features });
  }, [indiaOverview, stateDistricts, selectedLocation, weatherData]);

  // Update selected location marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded.current) return;

    const source = map.getSource('selected-location') as maplibregl.GeoJSONSource;
    if (!source) return;

    if (selectedLocation) {
      source.setData({
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [selectedLocation.lon, selectedLocation.lat] },
          properties: {},
        }],
      });
    } else {
      source.setData({ type: 'FeatureCollection', features: [] });
    }
  }, [selectedLocation]);

  // Update state polygons with temperature data
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded.current) return;

    const source = map.getSource('states') as maplibregl.GeoJSONSource;
    if (!source) return;

    const geojson = indiaStatesGeoJSON as GeoJSON.FeatureCollection;
    if (!indiaOverview?.states) return;

    const updatedFeatures = geojson.features.map((feature) => {
      const stateCode = feature.properties?.code as string;
      const stateData = indiaOverview.states.find((s) => s.code === stateCode);
      return {
        ...feature,
        properties: {
          ...feature.properties,
          temperature: stateData?.current?.temperature ?? 25,
          humidity: stateData?.current?.humidity ?? 60,
          alertLevel: stateData?.alertLevel ?? 'none',
        },
      };
    });

    source.setData({ type: 'FeatureCollection', features: updatedFeatures });
  }, [indiaOverview]);

  // Update district polygons with temperature data
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded.current || !stateDistricts) return;

    const source = map.getSource('districts') as maplibregl.GeoJSONSource;
    if (!source) return;

    // In a real implementation, this would come from a districts GeoJSON file
    // For now, we create placeholder features from the district data
    const features = stateDistricts.map((district) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [district.center.lon, district.center.lat],
      },
      properties: {
        code: district.code,
        name: district.name,
        stateCode: district.stateCode,
        temperature: district.current?.temperature ?? 25,
        alertLevel: district.alertLevel,
      },
    }));

    source.setData({ type: 'FeatureCollection', features });
  }, [stateDistricts]);

  // Animate pulse layer for selected location
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded.current || !selectedLocation) return;

    const animatePulse = () => {
      const layer = map.getLayer('selected-location-pulse');
      if (!layer) return;

      const time = Date.now() / 1000;
      const radius = 18 + Math.sin(time * 2) * 6;
      const opacity = 0.2 + Math.sin(time * 2) * 0.15;

      map.setPaintProperty('selected-location-pulse', 'circle-radius', radius);
      map.setPaintProperty('selected-location-pulse', 'circle-opacity', opacity);

      animationFrameRef.current = requestAnimationFrame(animatePulse);
    };

    animatePulse();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [selectedLocation]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full"
      style={{ width: '100%', height: '100%' }}
    />
  );
}

export default MapContainer;