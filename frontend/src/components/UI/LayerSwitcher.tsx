import { Thermometer, CloudRain, Wind, AlertTriangle } from 'lucide-react';
import { useAppStore, useActiveLayer } from '../../store/useAppStore';
import type { WeatherLayer } from '../../types';

export function LayerSwitcher() {
  const activeLayer = useActiveLayer();
  const setActiveLayer = useAppStore((state) => state.setActiveLayer);

  const layers: { id: WeatherLayer; label: string; icon: typeof Thermometer; color: string }[] = [
    { id: 'temperature', label: 'Temp', icon: Thermometer, color: 'text-amber-400' },
    { id: 'precipitation', label: 'Rain', icon: CloudRain, color: 'text-blue-400' },
    { id: 'wind', label: 'Wind', icon: Wind, color: 'text-cyan-400' },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle, color: 'text-red-400' },
  ];

  return (
    <div className="flex items-center gap-1 bg-dark-900/80 p-1 rounded-xl border border-dark-700/50 backdrop-blur-xl">
      {layers.map((layer) => {
        const Icon = layer.icon;
        const isActive = activeLayer === layer.id;
        return (
          <button
            key={layer.id}
            onClick={() => setActiveLayer(layer.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isActive
                ? 'bg-primary-600/30 text-white border border-primary-500/40 shadow-sm'
                : 'text-dark-400 hover:text-white hover:bg-dark-800/60'
            }`}
            title={`Switch to ${layer.label} layer`}
            aria-label={`${layer.label} weather layer`}
          >
            <Icon className={`w-3.5 h-3.5 ${layer.color}`} />
            <span>{layer.label}</span>
          </button>
        );
      })}
    </div>
  );
}
