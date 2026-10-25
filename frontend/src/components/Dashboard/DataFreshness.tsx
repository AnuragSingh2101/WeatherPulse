import { Clock, Database, Cloud, Wifi, WifiOff, Shield } from 'lucide-react';
import type { WeatherDashboardData } from '../../types';

interface DataFreshnessProps {
  data: WeatherDashboardData | null;
}

export function DataFreshness({ data }: DataFreshnessProps) {
  if (!data) return null;

  let lastUpdated = new Date();
  if (data.lastUpdated) {
    const raw = data.lastUpdated;
    lastUpdated = (!raw.endsWith('Z') && !raw.includes('+')) ? new Date(raw + 'Z') : new Date(raw);
  }
  const now = new Date();
  const diffMs = Math.abs(now.getTime() - lastUpdated.getTime());
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  let freshnessLabel: string;
  let freshnessColor: string;
  let freshnessIcon: React.ReactNode;

  if (diffMins < 5) {
    freshnessLabel = 'Just now';
    freshnessColor = 'text-green-400';
    freshnessIcon = <Wifi className="w-4 h-4" />;
  } else if (diffMins < 15) {
    freshnessLabel = `${diffMins} minutes ago`;
    freshnessColor = 'text-green-400';
    freshnessIcon = <Wifi className="w-4 h-4" />;
  } else if (diffMins < 60) {
    freshnessLabel = `${diffMins} minutes ago`;
    freshnessColor = 'text-yellow-400';
    freshnessIcon = <Wifi className="w-4 h-4" />;
  } else if (diffHours < 6) {
    freshnessLabel = `${diffHours} hours ago`;
    freshnessColor = 'text-yellow-400';
    freshnessIcon = <Wifi className="w-4 h-4" />;
  } else if (diffHours < 24) {
    freshnessLabel = `${diffHours} hours ago`;
    freshnessColor = 'text-orange-400';
    freshnessIcon = <WifiOff className="w-4 h-4" />;
  } else {
    freshnessLabel = `${Math.floor(diffHours / 24)} days ago`;
    freshnessColor = 'text-red-400';
    freshnessIcon = <WifiOff className="w-4 h-4" />;
  }

  const sourceLabels: Record<string, { label: string; icon: React.ReactNode; description: string }> = {
    'met-no': {
      label: 'MET Norway (Live)',
      icon: <Cloud className="w-4 h-4 text-cyan-400" />,
      description: 'Real-time meteorological weather data from MET Norway',
    },
    'open-meteo': {
      label: 'Open-Meteo',
      icon: <Cloud className="w-4 h-4 text-primary-400" />,
      description: 'Weather model forecast',
    },
    'cassandra': {
      label: 'Cassandra',
      icon: <Database className="w-4 h-4 text-yellow-400" />,
      description: 'Historical observations',
    },
    'mixed': {
      label: 'Mixed Sources',
      icon: <Shield className="w-4 h-4 text-purple-400" />,
      description: 'Combined model & observed data',
    },
  };

  const sourceInfo = sourceLabels[data.dataSource] || sourceLabels['met-no'] || sourceLabels['open-meteo'];
  const isDirectLiveStream = data.dataSource === 'met-no';

  return (
    <div className="glass-card p-4 border-t border-dark-700/50 mt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg bg-dark-700/50 flex items-center justify-center ${freshnessColor}`}>
            {freshnessIcon}
          </div>
          <div>
            <p className="text-white font-medium text-sm">Data Freshness</p>
            <p className={`text-sm ${freshnessColor}`}>Last updated: {freshnessLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-right">
          <div className="flex items-center gap-1.5 text-dark-400 text-xs">
            {sourceInfo.icon}
            <span className="font-medium text-white">{sourceInfo.label}</span>
          </div>
        </div>
      </div>
      <p className="text-dark-500 text-xs mt-3 ml-10">{sourceInfo.description}</p>

      {/* Stream status */}
      <div className="mt-3 pt-3 border-t border-dark-700/30 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-cyan-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          Live Real-Time Telemetry
        </span>
        <span className="flex items-center gap-1 text-emerald-400 font-medium">
          <Clock className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
}

export default DataFreshness;