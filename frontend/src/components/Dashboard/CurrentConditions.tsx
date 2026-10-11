import { Droplets, Wind, Gauge, Sun, Cloud, CloudRain, Thermometer, AlertCircle, CheckCircle, Info } from 'lucide-react';
import type { WeatherDashboardData, CurrentWeather } from '../../types';

interface CurrentConditionsProps {
  data: WeatherDashboardData | null;
}

export function CurrentConditions({ data }: CurrentConditionsProps) {
  const current = data?.current;

  if (!current) {
    return (
      <div className="glass-card p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-700 flex items-center justify-center">
          <Thermometer className="w-8 h-8 text-dark-500" />
        </div>
        <h3 className="text-dark-400 font-medium">No current weather data</h3>
        <p className="text-dark-500 text-sm mt-1">Weather information is not available for this location</p>
      </div>
    );
  }

  const weatherIcons: Record<string, React.ReactNode> = {
    clear: <Sun className="w-6 h-6 text-yellow-400" />,
    clouds: <Cloud className="w-6 h-6 text-dark-300" />,
    rain: <CloudRain className="w-6 h-6 text-blue-400" />,
    default: <Thermometer className="w-6 h-6 text-primary-400" />,
  };

  const getWeatherIcon = (code: number) => {
    if (code === 0) return weatherIcons.clear;
    if (code <= 3) return weatherIcons.clouds;
    if (code >= 51 && code <= 67) return weatherIcons.rain;
    if (code >= 71 && code <= 77) return <span className="text-blue-300">❄️</span>;
    if (code >= 80 && code <= 82) return weatherIcons.rain;
    if (code >= 95) return <span className="text-yellow-400">⛈️</span>;
    return weatherIcons.default;
  };

  const sourceLabel = current.source === 'observed' ? 'Observed (Weather Station)' : 'Model Estimate (Open-Meteo)';
  const sourceIcon = current.source === 'observed' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Info className="w-4 h-4 text-blue-400" />;

  const feelsLike = current.feelsLike ?? (current as any).feels_like ?? current.temperature;
  const windSpeed = current.windSpeed ?? (current as any).wind_speed ?? 0;
  const windDirectionText = current.windDirectionText ?? (current as any).wind_direction_text ?? 'N';
  const windDirection = current.windDirection ?? (current as any).wind_direction ?? 0;
  const weatherDescription = current.weatherDescription ?? (current as any).weather_description ?? 'Fair';
  const weatherCode = current.weatherCode ?? (current as any).weather_code ?? 0;

  return (
    <div className="space-y-6">
      {/* Main Temperature Display */}
      <div className="glass-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-5xl font-light text-white tabular-nums">{Math.round(current.temperature)}°</span>
              <span className="text-xl text-dark-400 font-medium">{weatherDescription}</span>
            </div>
            <div className="flex items-center gap-2 text-dark-400 text-sm">
              {sourceIcon}
              <span>{sourceLabel}</span>
              <span className="text-dark-600">•</span>
              <span>Updated {formatRelativeTime(current.time)}</span>
            </div>
          </div>
          <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-primary-600/20 flex items-center justify-center">
            {getWeatherIcon(weatherCode)}
          </div>
        </div>

        {/* Feels like */}
        <div className="mt-4 pt-4 border-t border-dark-700/50 flex items-center gap-4">
          <div className="flex items-center gap-2 text-dark-400">
            <Thermometer className="w-5 h-5" />
            <span>Feels like</span>
          </div>
          <span className="text-xl font-semibold text-white ml-auto">{Math.round(feelsLike)}°</span>
        </div>
      </div>

      {/* Weather Details Grid */}
      <div className="grid grid-cols-2 gap-3">
        <WeatherDetailCard
          icon={<Droplets className="w-5 h-5 text-blue-400" />}
          label="Humidity"
          value={`${current.humidity}%`}
          description={getHumidityDescription(current.humidity)}
        />
        <WeatherDetailCard
          icon={<Wind className="w-5 h-5 text-green-400" />}
          label="Wind"
          value={`${windSpeed} km/h`}
          description={`${windDirectionText} (${windDirection}°)`}
        />
        <WeatherDetailCard
          icon={<Gauge className="w-5 h-5 text-yellow-400" />}
          label="Pressure"
          value={`${current.pressure} hPa`}
          description={getPressureDescription(current.pressure)}
        />
        <WeatherDetailCard
          icon={<CloudRain className="w-5 h-5 text-cyan-400" />}
          label="Precipitation"
          value={`${current.precipitation} mm`}
          description={getPrecipitationDescription(current.precipitation)}
        />
      </div>

      {/* Additional Details */}
      <div className="glass-card p-4">
        <h4 className="text-dark-300 font-medium mb-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Additional Details
        </h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-dark-500">Visibility</span>
            <p className="text-white font-medium">{(current as any).visibility ? `${(current as any).visibility / 1000} km` : 'N/A'}</p>
          </div>
          <div>
            <span className="text-dark-500">Cloud Cover</span>
            <p className="text-white font-medium">{(current as any).cloudCover ? `${(current as any).cloudCover}%` : 'N/A'}</p>
          </div>
          <div>
            <span className="text-dark-500">UV Index</span>
            <p className="text-white font-medium">{(current as any).uvIndex ?? 'N/A'}</p>
          </div>
          <div>
            <span className="text-dark-500">Dew Point</span>
            <p className="text-white font-medium">{calculateDewPoint(current.temperature, current.humidity).toFixed(1)}°</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function WeatherDetailCard({ icon, label, value, description }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 text-dark-400 text-sm mb-1">
        {icon}
        <span className="font-medium">{label}</span>
      </div>
      <p className="text-xl font-semibold text-white">{value}</p>
      <p className="text-dark-500 text-xs mt-1">{description}</p>
    </div>
  );
}

function getHumidityDescription(humidity: number): string {
  if (humidity < 30) return 'Very dry';
  if (humidity < 50) return 'Comfortable';
  if (humidity < 70) return 'Moderate';
  if (humidity < 85) return 'Humid';
  return 'Very humid';
}

function getPressureDescription(pressure: number): string {
  if (pressure < 1000) return 'Low pressure';
  if (pressure < 1015) return 'Normal';
  if (pressure < 1030) return 'High pressure';
  return 'Very high';
}

function getPrecipitationDescription(precip: number): string {
  if (precip === 0) return 'No precipitation';
  if (precip < 2.5) return 'Light';
  if (precip < 10) return 'Moderate';
  if (precip < 50) return 'Heavy';
  return 'Very heavy';
}

function calculateDewPoint(temp: number, humidity: number): number {
  const a = 17.27;
  const b = 237.7;
  const alpha = (a * temp) / (b + temp) + Math.log(humidity / 100);
  return (b * alpha) / (a - alpha);
}

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}

export default CurrentConditions;