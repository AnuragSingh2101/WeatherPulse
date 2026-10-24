import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Coordinates } from '../../types';

interface LeafletMapProps {
  selectedLocation: Coordinates | null;
  onLocationSelect: (coords: Coordinates) => void;
  tileProviderUrl?: string;
  attribution?: string;
}

export function LeafletMap({
  selectedLocation,
  onLocationSelect,
  tileProviderUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Avoid duplicate initialization
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const initialLat = selectedLocation?.lat ?? 20.5937;
    const initialLon = selectedLocation?.lon ?? 78.9629;
    const initialZoom = selectedLocation ? 9 : 4;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLon],
      zoom: initialZoom,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer(tileProviderUrl, {
      maxZoom: 19,
      attribution: attribution,
    }).addTo(map);

    // Custom pulsing pin icon
    const customIcon = L.divIcon({
      className: 'weatherpulse-custom-marker',
      html: `
        <div style="position: relative; width: 32px; height: 32px;">
          <div style="position: absolute; inset: 0; border-radius: 50%; background: rgba(6, 182, 212, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: absolute; inset: 4px; border-radius: 50%; background: #06b6d4; border: 2px solid #ffffff; box-shadow: 0 4px 12px rgba(6, 182, 212, 0.6); display: flex; align-items: center; justify-content: center;">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: #ffffff;"></div>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    if (selectedLocation) {
      markerRef.current = L.marker([selectedLocation.lat, selectedLocation.lon], {
        icon: customIcon,
      }).addTo(map);
    }

    // Map click handler to select location
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const coords: Coordinates = {
        lat: Number(lat.toFixed(4)),
        lon: Number(lng.toFixed(4)),
      };

      if (markerRef.current) {
        markerRef.current.setLatLng([coords.lat, coords.lon]);
      } else {
        markerRef.current = L.marker([coords.lat, coords.lon], {
          icon: customIcon,
        }).addTo(map);
      }

      onLocationSelect(coords);
    });

    mapInstanceRef.current = map;

    // Handle container resizing
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, []); // Run once on mount

  // Update marker position and fly to location when selectedLocation changes from external controls
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedLocation) return;

    const customIcon = L.divIcon({
      className: 'weatherpulse-custom-marker',
      html: `
        <div style="position: relative; width: 32px; height: 32px;">
          <div style="position: absolute; inset: 0; border-radius: 50%; background: rgba(6, 182, 212, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: absolute; inset: 4px; border-radius: 50%; background: #06b6d4; border: 2px solid #ffffff; box-shadow: 0 4px 12px rgba(6, 182, 212, 0.6); display: flex; align-items: center; justify-content: center;">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: #ffffff;"></div>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    if (markerRef.current) {
      markerRef.current.setLatLng([selectedLocation.lat, selectedLocation.lon]);
    } else {
      markerRef.current = L.marker([selectedLocation.lat, selectedLocation.lon], {
        icon: customIcon,
      }).addTo(map);
    }

    map.flyTo([selectedLocation.lat, selectedLocation.lon], Math.max(map.getZoom(), 8), {
      duration: 1.2,
    });
  }, [selectedLocation?.lat, selectedLocation?.lon]);

  return (
    <div className="relative w-full h-full min-h-[300px] rounded-xl overflow-hidden border border-dark-700/60 shadow-inner z-0">
      <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '300px' }} />
      <div className="absolute bottom-2 left-2 z-[400] pointer-events-none">
        <span className="glass-panel px-2.5 py-1 rounded-md text-[11px] text-cyan-300 font-mono shadow-md border border-cyan-500/20">
          Click map to select coordinates
        </span>
      </div>
    </div>
  );
}
