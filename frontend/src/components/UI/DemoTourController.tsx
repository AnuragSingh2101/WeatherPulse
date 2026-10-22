import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, X, Sparkles, MapPin, Eye } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type { WeatherLayer } from '../../types';

interface TourStop {
  title: string;
  subtitle: string;
  name: string;
  coords: { lat: number; lon: number };
  zoom: number;
  pitch: number;
  bearing: number;
  layer: WeatherLayer;
  description: string;
}

const TOUR_STOPS: TourStop[] = [
  {
    title: 'Himalayan Ridge',
    subtitle: 'Alpine & Cold Zone',
    name: 'Shimla, Himachal Pradesh',
    coords: { lat: 31.1048, lon: 77.1734 },
    zoom: 9.5,
    pitch: 55,
    bearing: -20,
    layer: 'temperature',
    description: 'High altitude mountainous meteorological zone with sub-zero extremes and low dew point.',
  },
  {
    title: 'Thar Arid Zone',
    subtitle: 'Desert & Thermal Plume',
    name: 'Jaipur, Rajasthan',
    coords: { lat: 26.9124, lon: 75.7873 },
    zoom: 9.0,
    pitch: 45,
    bearing: 15,
    layer: 'temperature',
    description: 'Intense diurnal temperature variation, low ambient humidity, and dry continental airstream.',
  },
  {
    title: 'Konkan Coastline',
    subtitle: 'Tropical Marine & Monsoon Front',
    name: 'Mumbai, Maharashtra',
    coords: { lat: 19.0760, lon: 72.8777 },
    zoom: 9.5,
    pitch: 50,
    bearing: 30,
    layer: 'wind',
    description: 'Arabian Sea coastal gateway exhibiting high maritime moisture, diurnal land-sea breezes, and monsoonal precipitation.',
  },
  {
    title: 'Indo-Gangetic Basin',
    subtitle: 'Northern Plains & Cultural Heartland',
    name: 'Agra, Uttar Pradesh',
    coords: { lat: 27.1767, lon: 78.0081 },
    zoom: 9.5,
    pitch: 45,
    bearing: 10,
    layer: 'temperature',
    description: 'Fertile alluvial plain experiencing dramatic seasonal contrasts and dynamic pressure gradients.',
  },
  {
    title: 'Subcontinental Overview',
    subtitle: 'All-India 3D Meteorological Extrusion',
    name: 'India Overview',
    coords: { lat: 22.5937, lon: 78.9629 },
    zoom: 4.2,
    pitch: 45,
    bearing: 0,
    layer: 'temperature',
    description: 'Unified 3D polygon extrusion visualizes state-by-state meteorological intelligence across 3.28 million km².',
  },
];

interface DemoTourControllerProps {
  isActive: boolean;
  onClose: () => void;
}

export function DemoTourController({ isActive, onClose }: DemoTourControllerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const setSelectedLocation = useAppStore((state) => state.setSelectedLocation);
  const setViewport = useAppStore((state) => state.setViewport);
  const setActiveLayer = useAppStore((state) => state.setActiveLayer);
  const flyToIndia = useAppStore((state) => state.flyToIndia);

  const timerRef = useRef<any>(null);

  const goToStep = (step: number) => {
    const safeStep = (step + TOUR_STOPS.length) % TOUR_STOPS.length;
    setCurrentStep(safeStep);
    const stop = TOUR_STOPS[safeStep];

    setActiveLayer(stop.layer);

    if (stop.title === 'Subcontinental Overview') {
      flyToIndia();
    } else {
      setSelectedLocation(stop.coords, stop.name);
      setViewport({
        center: stop.coords,
        zoom: stop.zoom,
        pitch: stop.pitch,
        bearing: stop.bearing,
      });
    }
  };

  // Auto-advance when playing
  useEffect(() => {
    if (!isActive || !isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      goToStep(currentStep + 1);
    }, 7000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isPlaying, currentStep]);

  // When tour starts, jump to step 0
  useEffect(() => {
    if (isActive) {
      goToStep(0);
      setIsPlaying(true);
    }
  }, [isActive]);

  if (!isActive) return null;

  const currentStop = TOUR_STOPS[currentStep];

  return (
    <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-4 animate-slide-up pointer-events-auto">
      <div className="glass-panel p-4 rounded-2xl border border-cyan-500/40 bg-dark-900/90 shadow-2xl backdrop-blur-2xl space-y-3">
        {/* Top Info Bar */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                  Demo Presentation Tour • {currentStep + 1}/{TOUR_STOPS.length}
                </span>
              </div>
              <h4 className="text-white font-bold text-sm mt-0.5">{currentStop.title}</h4>
            </div>
          </div>

          <button
            onClick={() => {
              setIsPlaying(false);
              onClose();
            }}
            className="p-1 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
            title="Exit Demo Tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Narrative Description */}
        <p className="text-xs text-dark-300 leading-relaxed bg-dark-950/40 p-2.5 rounded-xl border border-white/5">
          {currentStop.description}
        </p>

        {/* Control Buttons & Progress Dots */}
        <div className="flex items-center justify-between pt-1">
          {/* Step indicators */}
          <div className="flex items-center gap-1.5">
            {TOUR_STOPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToStep(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentStep ? 'w-6 bg-cyan-400' : 'w-2 bg-dark-700 hover:bg-dark-500'
                }`}
                title={`Jump to stop ${idx + 1}`}
              />
            ))}
          </div>

          {/* Playback Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => goToStep(currentStep - 1)}
              className="p-1.5 rounded-lg text-dark-300 hover:text-white hover:bg-dark-800 transition-colors"
              title="Previous Stop"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-cyan-600/20 transition-all active:scale-95"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlaying ? 'Pause' : 'Resume'}</span>
            </button>

            <button
              onClick={() => goToStep(currentStep + 1)}
              className="p-1.5 rounded-lg text-dark-300 hover:text-white hover:bg-dark-800 transition-colors"
              title="Next Stop"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DemoTourController;
