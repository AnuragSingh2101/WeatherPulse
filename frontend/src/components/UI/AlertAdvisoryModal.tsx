import { useState } from 'react';
import { X, AlertTriangle, ShieldAlert, Thermometer, Wind, CloudRain, ExternalLink, MapPin } from 'lucide-react';
import { useIndiaOverview, useAppStore } from '../../store/useAppStore';

interface AlertAdvisoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AlertAdvisoryModal({ isOpen, onClose }: AlertAdvisoryModalProps) {
  const indiaOverview = useIndiaOverview();
  const setSelectedLocation = useAppStore((state) => state.setSelectedLocation);
  const [filter, setFilter] = useState<'all' | 'extreme' | 'high' | 'moderate'>('all');

  if (!isOpen) return null;

  // Extract all states with active alerts or meteorological anomalies
  const statesWithData = (indiaOverview?.states || []).map((s) => {
    const alertLevel = (s as any).alertLevel || (s as any).alert_level || 'none';
    const temp = s.current?.temperature ?? 25;
    const wind = s.current?.windSpeed ?? (s.current as any)?.wind_speed ?? 10;
    const precip = s.current?.precipitation ?? 0;

    // Detect natural meteorological warning triggers
    const alerts: { type: string; title: string; severity: 'extreme' | 'high' | 'moderate' | 'low'; description: string }[] = [];

    if (temp >= 40) {
      alerts.push({
        type: 'Heatwave',
        title: 'Severe Heatwave Advisory',
        severity: temp >= 43 ? 'extreme' : 'high',
        description: `Extreme daytime ambient temperatures reaching ${Math.round(temp)}°C. High risk of dehydration and heat stress.`,
      });
    } else if (temp <= 5) {
      alerts.push({
        type: 'Cold Wave',
        title: 'Severe Cold Wave Alert',
        severity: temp <= 2 ? 'extreme' : 'high',
        description: `Near-freezing temperatures observed at ${Math.round(temp)}°C. Frost hazard for agriculture and transport.`,
      });
    }

    if (wind >= 40) {
      alerts.push({
        type: 'Gale Winds',
        title: 'High Wind Velocity Warning',
        severity: wind >= 60 ? 'extreme' : 'high',
        description: `Sustained surface winds exceeding ${Math.round(wind)} km/h. Structural and marine advisory in effect.`,
      });
    }

    if (precip >= 15) {
      alerts.push({
        type: 'Heavy Rain',
        title: 'Localized Inundation Warning',
        severity: precip >= 30 ? 'extreme' : 'moderate',
        description: `Intense localized precipitation (${precip} mm/hr). Flash flood and waterlogging alert.`,
      });
    }

    if (alertLevel !== 'none' && alerts.length === 0) {
      alerts.push({
        type: 'Advisory',
        title: `${s.name} Meteorological Watch`,
        severity: (alertLevel === 'extreme' || alertLevel === 'high') ? alertLevel : 'moderate',
        description: `Active regional alert issued for ${s.name}. Monitoring atmospheric fluctuations.`,
      });
    }

    return {
      state: s,
      alerts,
    };
  }).filter((item) => item.alerts.length > 0);

  const filteredItems = statesWithData.flatMap((item) =>
    item.alerts.map((alert) => ({
      ...alert,
      state: item.state,
    }))
  ).filter((item) => filter === 'all' || item.severity === filter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-dark-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-dark-800 flex items-center justify-between bg-dark-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-500/20 text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base">National Meteorological Advisory Registry</h3>
              <p className="text-dark-400 text-xs">Real-time alert monitoring across all Indian states & territories</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Severity Filter Tabs */}
        <div className="px-4 py-2.5 border-b border-dark-800 bg-dark-900/60 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-dark-400 font-medium mr-1">Severity:</span>
          {(['all', 'extreme', 'high', 'moderate'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilter(lvl)}
              className={`px-3 py-1 rounded-lg font-medium capitalize transition-all ${
                filter === lvl
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm'
                  : 'text-dark-400 hover:text-white hover:bg-dark-800'
              }`}
            >
              {lvl} {lvl === 'all' && `(${filteredItems.length})`}
            </button>
          ))}
        </div>

        {/* Alert List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 scrollbar-thin">
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => {
              const badgeClass =
                item.severity === 'extreme'
                  ? 'bg-red-500/20 text-red-300 border-red-500/40'
                  : item.severity === 'high'
                  ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40';

              return (
                <div
                  key={`${item.state.code}-${index}`}
                  className="p-4 rounded-xl bg-dark-800/60 border border-white/5 hover:border-white/10 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${badgeClass}`}>
                        {item.severity}
                      </span>
                      <h4 className="text-white font-bold text-sm">{item.title}</h4>
                      <span className="text-dark-400 text-xs">• {item.state.name}</span>
                    </div>
                    <p className="text-dark-300 text-xs leading-relaxed">{item.description}</p>
                    <div className="flex items-center gap-3 text-[11px] text-dark-400 pt-1">
                      <span>Live Temp: <strong className="text-white">{Math.round(item.state.current?.temperature ?? 0)}°C</strong></span>
                      <span>Humidity: <strong className="text-white">{item.state.current?.humidity ?? 0}%</strong></span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedLocation(item.state.center, `${item.state.name} (${item.type})`);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-dark-700 hover:bg-cyan-600 hover:text-white text-dark-200 text-xs font-semibold transition-all flex items-center gap-1.5 self-end sm:self-center flex-shrink-0"
                  >
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Inspect Region</span>
                  </button>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-dark-400 space-y-2">
              <AlertTriangle className="w-8 h-8 mx-auto text-emerald-400 opacity-80" />
              <p className="text-sm font-medium text-white">No Critical Advisories Active</p>
              <p className="text-xs text-dark-400">All surveyed Indian states are within standard operational thresholds.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AlertAdvisoryModal;
