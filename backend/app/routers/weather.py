import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, HTTPException, Body

from app.models.weather import (
    CurrentWeather, HourlyForecast, DailyForecast, WeatherAlert,
    WeatherDashboardData, WeatherTrends, WeatherSource
)
from app.services import (
    get_open_meteo_client,
    get_cassandra_client,
    get_cache_service,
    get_metno_client,
    get_stream_manager,
    get_nominatim_client,
)
from app.services.weather_streamer import StreamStartRequest, WeatherStreamStatus, LocationInput

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/weather", tags=["weather"])

@router.get("/health")
async def get_weather_health() -> Dict[str, Any]:
    """
    Return operational status of the MET Norway, Nominatim, and Kafka integration
    without triggering excessive upstream requests.
    """
    metno = get_metno_client()
    nominatim = get_nominatim_client()
    streamer = get_stream_manager()
    cache = await get_cache_service()

    is_healthy = metno.last_status.get("configured", False)
    return {
        "status": "healthy" if is_healthy else "degraded",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "providers": {
            "met_norway": {
                "base_url": metno.base_url,
                "configured": metno.last_status["configured"],
                "last_request_time": metno.last_status["last_request_time"],
                "last_request_success": metno.last_status["last_request_success"],
                "last_error": metno.last_status["last_error"],
            },
            "nominatim": {
                "configured": nominatim.last_status["configured"],
                "last_request_time": nominatim.last_status["last_request_time"],
                "last_request_success": nominatim.last_status["last_request_success"],
                "last_error": nominatim.last_status["last_error"],
            },
            "cache": {
                "type": "in-memory-rfc7234",
                "entries_count": len(cache.local_cache),
            },
        },
        "streaming": streamer.get_status().model_dump(),
    }

@router.get("/forecast")
async def get_forecast(
    lat: float = Query(..., description="Latitude", ge=-90, le=90),
    lon: float = Query(..., description="Longitude", ge=-180, le=180),
    source: Optional[str] = Query("met-no", description="Source provider: 'met-no' (default) or 'open-meteo'"),
    hours: int = Query(48, ge=1, le=168, description="Hours of hourly forecast"),
    days: int = Query(7, ge=1, le=16, description="Days of daily forecast"),
):
    """
    Fetch or return cached forecast for coordinates from MET Norway Locationforecast 2.0.
    Returns normalized weather information and forecast timestamps.
    """
    if source == "open-meteo":
        client = await get_open_meteo_client()
        cache = await get_cache_service()
        cache_key = f"forecast_om:{lat}:{lon}:{hours}:{days}"
        cached = await cache.get(cache_key)
        if cached:
            return cached
        hourly, daily = await client.get_forecast(lat, lon, hours, days)
        result = {
            "hourly": [h.model_dump() for h in hourly],
            "daily": [d.model_dump() for d in daily],
        }
        await cache.set(cache_key, result, 1800)
        return result

    # Default: MET Norway Locationforecast 2.0 compact
    metno = get_metno_client()
    try:
        data = await metno.fetch_compact_forecast(lat, lon)
        
        # Build backward-compatible hourly array for existing dashboard tabs
        legacy_hourly = []
        for pt in data.get("forecast_hourly", [])[:hours]:
            pt_time = pt.get("time")
            try:
                dt_time = datetime.fromisoformat(pt_time.replace("Z", "+00:00"))
            except Exception:
                dt_time = datetime.now()

            temp = pt.get("air_temperature_c") or 25.0
            legacy_hourly.append({
                "time": dt_time.isoformat(),
                "temperature": temp,
                "feels_like": temp,
                "humidity": pt.get("relative_humidity_percent") or 60,
                "wind_speed": round((pt.get("wind_speed_mps") or 0.0) * 3.6, 1),  # m/s to km/h
                "wind_direction": int(pt.get("wind_direction_degrees") or 0),
                "wind_direction_text": pt.get("wind_direction_text", "N/A"),
                "precipitation": pt.get("precipitation_mm") or 0.0,
                "precipitation_probability": 0,
                "weather_code": 0,
                "weather_description": pt.get("condition", "Fair"),
                "pressure": pt.get("air_pressure_hpa") or 1013.0,
                "cloud_cover": int(pt.get("cloud_area_fraction_percent") or 0),
                "visibility": 10000.0,
                "uv_index": 0.0,
            })

        # Augment with both MET Norway format and legacy format
        response_payload = {
            **data,
            "hourly": legacy_hourly,
            "daily": [],
        }
        return response_payload
    except Exception as e:
        logger.error(f"Failed to fetch forecast from MET Norway for ({lat}, {lon}): {e}")
        raise HTTPException(status_code=502, detail=f"Weather provider error: {str(e)}")

# --- Kafka Streaming Ingestion Lifecycle Endpoints ---

@router.post("/stream/start", response_model=WeatherStreamStatus)
async def start_weather_stream(
    payload: Optional[StreamStartRequest] = Body(default=None)
) -> WeatherStreamStatus:
    """
    Start weather data streaming ingestion into Apache Kafka.
    Accepts a single location or multiple locations.
    Validates coordinates and ingestion interval settings.
    """
    streamer = get_stream_manager()

    locations: List[LocationInput] = []
    if payload:
        if payload.locations:
            locations.extend(payload.locations)
        elif payload.location:
            locations.append(payload.location)

    fetch_interval = payload.fetch_interval_seconds if payload else None

    # Validate coordinates
    for loc in locations:
        if not (-90 <= loc.latitude <= 90):
            raise HTTPException(status_code=400, detail=f"Invalid latitude: {loc.latitude}")
        if not (-180 <= loc.longitude <= 180):
            raise HTTPException(status_code=400, detail=f"Invalid longitude: {loc.longitude}")

    status = await streamer.start(
        locations=locations if locations else None,
        fetch_interval=fetch_interval,
    )
    return status

@router.post("/stream/stop", response_model=WeatherStreamStatus)
async def stop_weather_stream() -> WeatherStreamStatus:
    """
    Stop weather data streaming ingestion cleanly without leaving duplicate
    background tasks or dangling producers.
    """
    streamer = get_stream_manager()
    status = await streamer.stop()
    return status

@router.get("/stream/status", response_model=WeatherStreamStatus)
async def get_weather_stream_status() -> WeatherStreamStatus:
    """
    Return current ingestion status, configured locations, last fetch timestamp,
    last published event timestamp, and recent errors.
    """
    streamer = get_stream_manager()
    return streamer.get_status()

# --- Legacy Supporting Endpoints ---

@router.get("/current", response_model=CurrentWeather)
async def get_current_weather(
    lat: float = Query(..., description="Latitude", ge=-90, le=90),
    lon: float = Query(..., description="Longitude", ge=-180, le=180),
):
    """Get real-time current weather conditions directly from live API without caching"""
    metno = get_metno_client()
    try:
        data = await metno.fetch_compact_forecast(lat, lon, force_refresh=True)
        pt = data.get("current", {})
        return CurrentWeather(
            temperature=pt.get("air_temperature_c") or 25.0,
            feels_like=pt.get("air_temperature_c") or 25.0,
            humidity=int(pt.get("relative_humidity_percent") or 50),
            wind_speed=round((pt.get("wind_speed_mps") or 0.0) * 3.6, 1),
            wind_direction=int(pt.get("wind_direction_degrees") or 0),
            wind_direction_text=pt.get("wind_direction_text", "N"),
            precipitation=pt.get("precipitation_mm") or 0.0,
            pressure=pt.get("air_pressure_hpa") or 1013.0,
            weather_code=0,
            weather_description=pt.get("condition", "Fair"),
            is_day=True,
            time=datetime.now(),
            source=WeatherSource.MET_NORWAY,
            visibility=10.0,
            cloud_cover=int(pt.get("cloud_area_fraction_percent") or 0),
            uv_index=0.0,
        )
    except Exception:
        om_client = await get_open_meteo_client()
        return await om_client.get_current_weather(lat, lon)

@router.get("/historical", response_model=WeatherTrends)
async def get_historical_weather(
    lat: float = Query(..., description="Latitude", ge=-90, le=90),
    lon: float = Query(..., description="Longitude", ge=-180, le=180),
    days: int = Query(30, ge=1, le=92, description="Days of historical data"),
):
    """Get historical weather trends for coordinates directly from API without caching"""
    client = await get_open_meteo_client()
    trends = await client.get_historical(lat, lon, days)
    return trends

@router.get("/alerts", response_model=List[WeatherAlert])
async def get_weather_alerts(
    lat: float = Query(..., description="Latitude", ge=-90, le=90),
    lon: float = Query(..., description="Longitude", ge=-180, le=180),
):
    """Get real-time weather alerts for coordinates directly from live data"""
    client = await get_open_meteo_client()
    current = await client.get_current_weather(lat, lon)
    hourly, daily = await client.get_forecast(lat, lon, 48, 7)
    alerts = await client.get_alerts(lat, lon, current, daily)
    return alerts

@router.get("/dashboard", response_model=WeatherDashboardData)
async def get_dashboard_data(
    lat: float = Query(..., description="Latitude", ge=-90, le=90),
    lon: float = Query(..., description="Longitude", ge=-180, le=180),
    name: str = Query("Selected Location", description="Location name"),
):
    """
    Get real-time weather dashboard data directly from the live API.
    Zero persistent caching / storing in Redis or local memory.
    """
    metno = get_metno_client()
    current = None
    hourly = []
    daily = []
    data_source = WeatherSource.MET_NORWAY

    try:
        forecast_data = await metno.fetch_compact_forecast(lat, lon, force_refresh=True)
        pt = forecast_data.get("current", {})

        wind_kmh = round((pt.get("wind_speed_mps") or 0.0) * 3.6, 1)
        precip = pt.get("precipitation_mm") or 0.0

        current = CurrentWeather(
            temperature=pt.get("air_temperature_c") or 25.0,
            feels_like=pt.get("air_temperature_c") or 25.0,
            humidity=int(pt.get("relative_humidity_percent") or 50),
            wind_speed=wind_kmh,
            wind_direction=int(pt.get("wind_direction_degrees") or 0),
            wind_direction_text=pt.get("wind_direction_text", "N"),
            precipitation=precip,
            pressure=pt.get("air_pressure_hpa") or 1013.0,
            weather_code=pt.get("weather_code", 1),
            weather_description=pt.get("condition", "Fair"),
            is_day=True,
            time=datetime.now(timezone.utc),
            source=WeatherSource.MET_NORWAY,
            visibility=10.0,
            cloud_cover=int(pt.get("cloud_area_fraction_percent") or 0),
            uv_index=0.0,
        )

        for item in forecast_data.get("forecast_hourly", [])[:48]:
            try:
                item_time = datetime.fromisoformat(item["time"].replace("Z", "+00:00"))
            except Exception:
                item_time = datetime.now()
            hourly.append(HourlyForecast(
                time=item_time,
                temperature=item.get("air_temperature_c") or 25.0,
                feels_like=item.get("air_temperature_c") or 25.0,
                humidity=int(item.get("relative_humidity_percent") or 50),
                wind_speed=round((item.get("wind_speed_mps") or 0.0) * 3.6, 1),
                wind_direction=int(item.get("wind_direction_degrees") or 0),
                wind_direction_text=item.get("wind_direction_text", "N"),
                precipitation=item.get("precipitation_mm") or 0.0,
                precipitation_probability=0,
                weather_code=item.get("weather_code", 1),
                weather_description=item.get("condition", "Fair"),
                pressure=item.get("air_pressure_hpa") or 1013.0,
                cloud_cover=int(item.get("cloud_area_fraction_percent") or 0),
                visibility=10000.0,
                uv_index=0.0,
            ))
    except Exception as e:
        logger.warning(f"MET Norway live fetch failed ({e}); falling back to Open-Meteo live API")
        om_client = await get_open_meteo_client()
        current = await om_client.get_current_weather(lat, lon)
        hourly, daily = await om_client.get_forecast(lat, lon, 48, 7)
        data_source = WeatherSource.OPEN_METEO

    om_client = await get_open_meteo_client()
    trends = await om_client.get_historical(lat, lon, 30)
    alerts = await om_client.get_alerts(lat, lon, current, daily)

    return WeatherDashboardData(
        location={"lat": lat, "lon": lon},
        location_name=name,
        current=current,
        hourly=hourly,
        daily=daily,
        trends=trends,
        alerts=alerts,
        last_updated=datetime.now(timezone.utc),
        data_source=data_source,
    )