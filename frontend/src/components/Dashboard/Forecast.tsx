import { useState } from 'react';
import { Sun, Cloud, CloudRain, Wind, Droplets, ChevronRight, Calendar, Clock } from 'lucide-react';
import type { WeatherDashboardData, HourlyForecast, DailyForecast } from '../../types';

interface ForecastProps {
  data: WeatherDashboardData | null;
}

export function Forecast({ data }: ForecastProps) {
  const [view, setView] = useState<'hourly' | 'daily'>('hourly');
  const hourly = data?.hourly || [];
  const daily = data?.daily || [];

  if (hourly.length === 0 && daily.length === 0) {
    return (
      <div className="glass-card p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-700 flex items-center justify-center">
          <Calendar className="w-8 h-8 text-dark-500" />
        </div>
        <h3 className="text-dark-400 font-medium">No forecast data available</h3>
        <p className="text-dark-500 text-sm mt-1">Forecast information will appear here when available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex gap-2 bg-dark-800/50 rounded-lg p-1">
        <button
          onClick={() => setView('hourly')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            view === 'hourly'
              ? 'bg-primary-600 text-white shadow-lg'
              : 'text-dark-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4 inline mr-1" />
          Hourly (48h)
        </button>
        <button
          onClick={() => setView('daily')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            view === 'daily'
              ? 'bg-primary-600 text-white shadow-lg'
              : 'text-dark-400 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4 inline mr-1" />
          Daily (7d)
        </button>
      </div>

      {view === 'hourly' && hourly.length > 0 && (
        <HourlyForecastView data={hourly} />
      )}

      {view === 'daily' && daily.length > 0 && (
        <DailyForecastView data={daily} />
      )}
    </div>
  );
}

function HourlyForecastView({ data }: { data: HourlyForecast[] }) {
  return (
    <div className="space-y-4">
      <h4 className="text-dark-300 font-medium flex items-center gap-2">
        <Clock className="w-4 h-4" />
        Next 48 Hours
      </h4>
      <div className="overflow-x-auto pb-4 scrollbar-thin">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="text-dark-500 border-b border-dark-700/50">
              <th className="text-left py-2 px-3">Time</th>
              <th className="text-left py-2 px-3">Temp</th>
              <th className="text-left py-2 px-3">Feels Like</th>
              <th className="text-left py-2 px-3">Condition</th>
              <th className="text-left py-2 px-3">Precip</th>
              <th className="text-left py-2 px-3">Humidity</th>
              <th className="text-left py-2 px-3">Wind</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 48).map((hour, index) => (
              <tr
                key={hour.time}
                className={`border-b border-dark-700/30 hover:bg-dark-800/50 transition-colors ${
                  index === 0 ? 'bg-primary-600/10' : ''
                }`}
              >
                <td className="py-2 px-3 font-medium text-white">
                  {formatHour(hour.time)}
                </td>
                <td className="py-2 px-3 text-white tabular-nums">
                  {Math.round(hour.temperature ?? 0)}°
                </td>
                <td className="py-2 px-3 text-dark-300 tabular-nums">
                  {Math.round(hour.feelsLike ?? (hour as any).feels_like ?? hour.temperature ?? 0)}°
                </td>
                <td className="py-2 px-3 flex items-center gap-2">
                  {getWeatherIcon(hour.weatherCode ?? 0)}
                  <span className="text-dark-300 capitalize">{hour.weatherDescription ?? 'Fair'}</span>
                </td>
                <td className="py-2 px-3 flex items-center gap-1 text-blue-400">
                  <Droplets className="w-3.5 h-3.5" />
                  <span>{(hour.precipitation ?? 0).toFixed(1)}mm ({hour.precipitationProbability ?? 0}%)</span>
                </td>
                <td className="py-2 px-3 text-dark-300">
                  {hour.humidity ?? 50}%
                </td>
                <td className="py-2 px-3 flex items-center gap-1 text-green-400">
                  <Wind className="w-3.5 h-3.5" />
                  <span>{Math.round(hour.windSpeed ?? 0)} km/h {hour.windDirectionText ?? 'N'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DailyForecastView({ data }: { data: DailyForecast[] }) {
  return (
    <div className="space-y-3">
      <h4 className="text-dark-300 font-medium flex items-center gap-2">
        <Calendar className="w-4 h-4" />
        7-Day Forecast
      </h4>
      <div className="space-y-2">
        {data.map((day) => (
          <DailyForecastCard key={day.date} data={day} />
        ))}
      </div>
    </div>
  );
}

function DailyForecastCard({ data }: { data: DailyForecast }) {
  const isToday = new Date(data.date).toDateString() === new Date().toDateString();

  return (
    <div className={`glass-card p-4 ${isToday ? 'border-primary-500/30 bg-primary-600/5' : ''}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isToday ? 'bg-primary-600/20' : 'bg-dark-700/50'
          }`}>
            {getWeatherIcon(data.weatherCode)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`font-medium ${isToday ? 'text-primary-400' : 'text-white'}`}>
                {isToday ? 'Today' : formatDay(data.date)}
              </span>
              <span className="text-dark-400 text-sm">{data.weatherDescription}</span>
            </div>
            <div className="flex items-center gap-4 text-dark-400 text-xs mt-1">
              <span>🌅 {formatTime(data.sunrise)}</span>
              <span>🌇 {formatTime(data.sunset)}</span>
              <span>☀️ UV {data.uvIndexMax}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 text-right min-w-[200px]">
          <div className="flex flex-col items-end">
            <span className="text-2xl font-bold text-white tabular-nums">{Math.round(data.temperatureMax ?? (data as any).temperature_max ?? 0)}°</span>
            <span className="text-dark-400 text-sm">/{Math.round(data.temperatureMin ?? (data as any).temperature_min ?? 0)}°</span>
          </div>
          <div className="flex flex-col items-end gap-1 text-xs text-dark-400">
            <div className="flex items-center gap-1">
              <Droplets className="w-3 h-3 text-blue-400" />
              <span>{((data.precipitationSum ?? (data as any).precipitation_sum ?? 0)).toFixed(1)}mm ({data.precipitationProbabilityMax ?? (data as any).precipitation_probability_max ?? 0}%)</span>
            </div>
            <div className="flex items-center gap-1">
              <Wind className="w-3 h-3 text-emerald-400" />
              <span>{Math.round(data.windSpeedMax ?? (data as any).wind_speed_max ?? 0)} km/h</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getWeatherIcon(code: number) {
  if (code === 0) return <Sun className="w-5 h-5 text-yellow-400" />;
  if (code <= 3) return <Cloud className="w-5 h-5 text-dark-300" />;
  if (code >= 51 && code <= 67) return <CloudRain className="w-5 h-5 text-blue-400" />;
  if (code >= 71 && code <= 77) return <span className="text-blue-300 text-lg">❄️</span>;
  if (code >= 80 && code <= 82) return <CloudRain className="w-5 h-5 text-blue-400" />;
  if (code >= 95) return <span className="text-yellow-400 text-lg">⛈️</span>;
  return <Cloud className="w-5 h-5 text-dark-300" />;
}

function formatHour(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDay(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default Forecast;