import logging
import math
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from typing import Any, Dict, List, Optional, Tuple
import httpx

from app.config import settings

logger = logging.getLogger(__name__)

# Cache entry: key -> {"data": parsed_data, "last_modified": str, "expires": float, "raw": dict}
_forecast_memory_cache: Dict[str, Dict[str, Any]] = {}

MET_SYMBOL_DESCRIPTIONS = {
    "clearsky_day": "Clear Sky",
    "clearsky_night": "Clear Sky",
    "clearsky_polartwilight": "Clear Sky",
    "fair_day": "Fair",
    "fair_night": "Fair",
    "fair_polartwilight": "Fair",
    "partlycloudy_day": "Partly Cloudy",
    "partlycloudy_night": "Partly Cloudy",
    "partlycloudy_polartwilight": "Partly Cloudy",
    "cloudy": "Cloudy",
    "rainshowers_day": "Rain Showers",
    "rainshowers_night": "Rain Showers",
    "rainshowers_polartwilight": "Rain Showers",
    "rainshowersandthunder_day": "Rain Showers & Thunder",
    "rainshowersandthunder_night": "Rain Showers & Thunder",
    "sleetshowers_day": "Sleet Showers",
    "snowshowers_day": "Snow Showers",
    "rain": "Rain",
    "heavyrain": "Heavy Rain",
    "heavyrainandthunder": "Heavy Rain & Thunder",
    "sleet": "Sleet",
    "snow": "Snow",
    "snowandthunder": "Snow & Thunder",
    "fog": "Fog",
    "sleetshowersandthunder_day": "Sleet Showers & Thunder",
    "snowshowersandthunder_day": "Snow Showers & Thunder",
    "rainandthunder": "Rain & Thunder",
    "sleetandthunder": "Sleet & Thunder",
    "lightrainshowersandthunder_day": "Light Rain Showers & Thunder",
    "heavyrainshowersandthunder_day": "Heavy Rain Showers & Thunder",
    "lightrainshowers_day": "Light Rain Showers",
    "heavyrainshowers_day": "Heavy Rain Showers",
    "lightrain": "Light Rain",
    "lightsnow": "Light Snow",
    "heavysnow": "Heavy Snow",
    "lightsnowshowers_day": "Light Snow Showers",
    "heavysnowshowers_day": "Heavy Snow Showers",
    "lightrainandthunder": "Light Rain & Thunder",
    "lightsleet": "Light Sleet",
    "heavysleet": "Heavy Sleet",
}

def symbol_to_condition(symbol_code: Optional[str]) -> str:
    if not symbol_code:
        return "Fair"
    base = symbol_code.split("_")[0]
    return MET_SYMBOL_DESCRIPTIONS.get(symbol_code, MET_SYMBOL_DESCRIPTIONS.get(base, symbol_code.replace("_", " ").title()))

def symbol_to_weather_code(symbol_code: Optional[str]) -> int:
    """Map MET Norway symbol code to WMO Weather Code."""
    if not symbol_code:
        return 1
    base = symbol_code.split("_")[0].lower()
    if "clearsky" in base:
        return 0
    if "fair" in base:
        return 1
    if "partlycloudy" in base:
        return 2
    if "cloudy" in base or "overcast" in base:
        return 3
    if "fog" in base:
        return 45
    if "thunder" in base:
        return 95
    if "heavyrain" in base or "heavyrainshowers" in base:
        return 65
    if "lightrain" in base or "lightrainshowers" in base:
        return 61
    if "rain" in base or "rainshowers" in base:
        return 63
    if "snow" in base:
        return 71
    if "sleet" in base:
        return 68
    return 3

def degrees_to_direction(degrees: Optional[float]) -> str:
    if degrees is None:
        return "N/A"
    dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    ix = round(degrees / (360.0 / len(dirs))) % len(dirs)
    return dirs[ix]

def calculate_dew_point(temp_c: Optional[float], humidity_pct: Optional[float]) -> Optional[float]:
    if temp_c is None or humidity_pct is None or humidity_pct <= 0:
        return None
    # Magnus formula approximation
    a = 17.27
    b = 237.7
    alpha = ((a * temp_c) / (b + temp_c)) + math.log(humidity_pct / 100.0)
    dew_point = (b * alpha) / (a - alpha)
    return round(dew_point, 1)

class METNorwayClient:
    """
    MET Norway Locationforecast 2.0 Compact client.
    Handles upstream User-Agent identification, RFC 7234 HTTP conditional
    caching (Expires, Last-Modified, If-Modified-Since), and response normalization.
    """
    def __init__(self, base_url: Optional[str] = None, user_agent: Optional[str] = None):
        self.base_url = base_url or settings.metno_base_url
        self.user_agent = user_agent or settings.metno_user_agent
        self._client: Optional[httpx.AsyncClient] = None
        self.last_status: Dict[str, Any] = {
            "configured": bool(self.user_agent and self.base_url),
            "last_request_time": None,
            "last_request_success": None,
            "last_error": None,
        }

    async def get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=15.0,
                headers={"User-Agent": self.user_agent, "Accept": "application/json"},
            )
        return self._client

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            self._client = None

    def _get_cache_key(self, lat: float, lon: float) -> str:
        # 4 decimal places precision matches MET Norway grid resolution
        return f"{round(lat, 4)}:{round(lon, 4)}"

    async def fetch_compact_forecast(
        self, lat: float, lon: float, force_refresh: bool = False
    ) -> Dict[str, Any]:
        """
        Fetch compact forecast from MET Norway with HTTP caching.
        Returns parsed normalized dictionary.
        """
        cache_key = self._get_cache_key(lat, lon)
        now_ts = datetime.now(timezone.utc).timestamp()
        cached = _forecast_memory_cache.get(cache_key)

        headers: Dict[str, str] = {}
        if cached and not force_refresh:
            # Check if cache is still valid per upstream Expires header
            if cached.get("expires", 0) > now_ts:
                logger.debug(f"MET Norway cache hit for {lat}, {lon}")
                return cached["data"]
            # Cache expired; use conditional HTTP request
            if cached.get("last_modified"):
                headers["If-Modified-Since"] = cached["last_modified"]

        client = await self.get_client()
        params = {"lat": f"{lat:.4f}", "lon": f"{lon:.4f}"}

        try:
            response = await client.get(self.base_url, params=params, headers=headers)
            self.last_status["last_request_time"] = datetime.now(timezone.utc).isoformat()

            if response.status_code == 304 and cached:
                # Upstream forecast hasn't changed
                # Update expires header if present
                expires_header = response.headers.get("expires")
                if expires_header:
                    try:
                        exp_dt = parsedate_to_datetime(expires_header)
                        cached["expires"] = exp_dt.timestamp()
                    except Exception:
                        cached["expires"] = now_ts + 600
                self.last_status["last_request_success"] = True
                self.last_status["last_error"] = None
                return cached["data"]

            response.raise_for_status()
            data = response.json()
            self.last_status["last_request_success"] = True
            self.last_status["last_error"] = None

            # Calculate expiry time
            expires_ts = now_ts + 1800  # Default 30 min
            expires_header = response.headers.get("expires")
            if expires_header:
                try:
                    exp_dt = parsedate_to_datetime(expires_header)
                    expires_ts = exp_dt.timestamp()
                except Exception:
                    pass

            last_modified = response.headers.get("last-modified")
            normalized = self._normalize_forecast(lat, lon, data)

            _forecast_memory_cache[cache_key] = {
                "data": normalized,
                "last_modified": last_modified,
                "expires": expires_ts,
                "raw": data,
            }
            return normalized

        except httpx.HTTPStatusError as e:
            self.last_status["last_request_success"] = False
            self.last_status["last_error"] = f"HTTP {e.response.status_code}: {e.response.text[:120]}"
            logger.error(f"MET Norway HTTP error ({e.response.status_code}): {e}")
            if cached:
                return cached["data"]
            raise
        except Exception as e:
            self.last_status["last_request_success"] = False
            self.last_status["last_error"] = str(e)
            logger.error(f"MET Norway request failed: {e}")
            if cached:
                return cached["data"]
            raise

    def _normalize_forecast(self, lat: float, lon: float, raw: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize MET Norway JSON into application structure."""
        properties = raw.get("properties", {})
        meta = properties.get("meta", {})
        updated_at = meta.get("updated_at")
        timeseries = properties.get("timeseries", [])

        if not timeseries:
            raise ValueError("MET Norway returned empty timeseries")

        hourly_points: List[Dict[str, Any]] = []
        for item in timeseries:
            time_str = item.get("time")
            data = item.get("data", {})
            instant_details = data.get("instant", {}).get("details", {})

            # Precipitation and weather symbol can be in next_1_hours, next_6_hours, or next_12_hours
            next_1h = data.get("next_1_hours", {})
            next_6h = data.get("next_6_hours", {})
            next_12h = data.get("next_12_hours", {})

            symbol_code = (
                next_1h.get("summary", {}).get("symbol_code")
                or next_6h.get("summary", {}).get("symbol_code")
                or next_12h.get("summary", {}).get("symbol_code")
            )

            precipitation = (
                next_1h.get("details", {}).get("precipitation_amount")
                if "precipitation_amount" in next_1h.get("details", {})
                else next_6h.get("details", {}).get("precipitation_amount")
            )

            precip_6h = next_6h.get("details", {}).get("precipitation_amount")
            wind_dir_deg = instant_details.get("wind_from_direction")
            point = {
                "time": time_str,
                "air_temperature_c": instant_details.get("air_temperature"),
                "relative_humidity_percent": instant_details.get("relative_humidity"),
                "wind_speed_mps": instant_details.get("wind_speed"),
                "wind_direction_degrees": wind_dir_deg,
                "wind_direction_text": degrees_to_direction(wind_dir_deg),
                "air_pressure_hpa": instant_details.get("air_pressure_at_sea_level"),
                "cloud_area_fraction_percent": instant_details.get("cloud_area_fraction"),
                "precipitation_mm": precipitation,
                "precipitation_next_6h": precip_6h,
                "symbol_code": symbol_code,
                "weather_code": symbol_to_weather_code(symbol_code),
                "condition": symbol_to_condition(symbol_code),
                "dew_point_c": calculate_dew_point(
                    instant_details.get("air_temperature"),
                    instant_details.get("relative_humidity"),
                ),
            }
            hourly_points.append(point)

        # Current is the first available timeseries record
        current_point = hourly_points[0]

        return {
            "source": "met-no",
            "updated_at": updated_at,
            "location": {
                "latitude": lat,
                "longitude": lon,
            },
            "current": current_point,
            "forecast_hourly": hourly_points[:72],  # up to 72 hours
            "total_points": len(hourly_points),
        }

# Global singleton client
_metno_client: Optional[METNorwayClient] = None

def get_metno_client() -> METNorwayClient:
    global _metno_client
    if _metno_client is None:
        _metno_client = METNorwayClient()
    return _metno_client

async def close_metno_client():
    global _metno_client
    if _metno_client:
        await _metno_client.close()
        _metno_client = None
