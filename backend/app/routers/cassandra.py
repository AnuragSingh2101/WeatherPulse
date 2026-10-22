import logging
from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from datetime import datetime
from app.models.weather import WeatherTrends
from app.services import get_cassandra_client, get_cache_service, get_open_meteo_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cassandra", tags=["cassandra"])

# Default coordinates for major Indian cities to enable instant historical fallback
CITY_FALLBACK_COORDS = {
    "delhi": {"lat": 28.6139, "lon": 77.2090},
    "new delhi": {"lat": 28.6139, "lon": 77.2090},
    "mumbai": {"lat": 19.0760, "lon": 72.8777},
    "bengaluru": {"lat": 12.9716, "lon": 77.5946},
    "bangalore": {"lat": 12.9716, "lon": 77.5946},
    "chennai": {"lat": 13.0827, "lon": 80.2707},
    "kolkata": {"lat": 22.5726, "lon": 88.3639},
    "hyderabad": {"lat": 17.3850, "lon": 78.4867},
    "ahmedabad": {"lat": 23.0225, "lon": 72.5714},
    "pune": {"lat": 18.5204, "lon": 73.8567},
    "jaipur": {"lat": 26.9124, "lon": 75.7873},
    "lucknow": {"lat": 26.8467, "lon": 80.9462},
    "patna": {"lat": 25.5941, "lon": 85.1376},
    "bhopal": {"lat": 23.2599, "lon": 77.4126},
    "chandigarh": {"lat": 30.7333, "lon": 76.7794},
    "shimla": {"lat": 31.1048, "lon": 77.1734},
    "srinagar": {"lat": 34.0837, "lon": 74.7973},
}

@router.get("/historical", response_model=WeatherTrends)
async def get_cassandra_historical(
    city: str = Query(..., description="City name"),
    days: int = Query(30, ge=1, le=365, description="Days of historical data"),
):
    """Get historical weather data from Cassandra for a city, falling back to Open-Meteo if unavailable."""
    cache = await get_cache_service()
    
    cache_key = f"cassandra:historical:{city.lower().strip()}:{days}"
    cached = await cache.get(cache_key)
    if cached:
        return WeatherTrends(**cached)
    
    # 1. Attempt Cassandra query
    try:
        client = await get_cassandra_client()
        trends = await client.get_historical_for_city(city, days)
        # If Cassandra returned actual historical data points
        if trends and trends.temperature.data and len(trends.temperature.data) > 0:
            await cache.set(cache_key, trends.model_dump(), 3600)
            return trends
    except Exception as e:
        logger.warning(f"Cassandra query for city '{city}' unavailable ({e}), trying Open-Meteo historical fallback")

    # 2. Resilient Fallback to Open-Meteo historical archive
    try:
        om_client = await get_open_meteo_client()
        city_norm = city.lower().strip()
        coords = CITY_FALLBACK_COORDS.get(city_norm)
        
        if not coords:
            geo_results = await om_client.geocode(city, limit=1)
            if geo_results:
                coords = {"lat": geo_results[0].latitude, "lon": geo_results[0].longitude}
            else:
                coords = {"lat": 22.5937, "lon": 78.9629} # Center of India fallback
        
        fallback_trends = await om_client.get_historical(coords["lat"], coords["lon"], days)
        fallback_trends.location_name = city
        await cache.set(cache_key, fallback_trends.model_dump(), 1800)
        return fallback_trends
    except Exception as fb_err:
        logger.error(f"Fallback historical query failed for city '{city}': {fb_err}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch historical weather: {str(fb_err)}")

@router.get("/latest")
async def get_cassandra_latest(city: str = Query(..., description="City name")):
    """Get latest weather record from Cassandra for a city, falling back gracefully to live Open-Meteo if unavailable."""
    try:
        client = await get_cassandra_client()
        result = await client.get_latest_for_city(city)
        if result is not None:
            return result
    except Exception as e:
        logger.warning(f"Cassandra get_latest failed for '{city}' ({e}), using Open-Meteo fallback")

    # Fallback to current weather from Open-Meteo
    try:
        om_client = await get_open_meteo_client()
        city_norm = city.lower().strip()
        coords = CITY_FALLBACK_COORDS.get(city_norm)
        if not coords:
            geo_results = await om_client.geocode(city, limit=1)
            if geo_results:
                coords = {"lat": geo_results[0].latitude, "lon": geo_results[0].longitude}
            else:
                coords = {"lat": 28.6139, "lon": 77.2090}
        
        curr = await om_client.get_current_weather(coords["lat"], coords["lon"])
        return {
            "city": city,
            "station_id": f"OM-{city.upper()}",
            "timestamp": curr.time.isoformat(),
            "temperature": curr.temperature,
            "humidity": curr.humidity,
            "pressure": curr.pressure,
            "wind_speed": curr.wind_speed,
            "wind_direction": curr.wind_direction_text,
            "precipitation": curr.precipitation,
            "weather_condition": curr.weather_description,
            "source": "open-meteo-fallback"
        }
    except Exception as fb_err:
        raise HTTPException(status_code=404, detail=f"No data found for city: {city}")

@router.get("/cities")
async def get_cassandra_cities():
    """Get list of all cities with data in Cassandra"""
    try:
        client = await get_cassandra_client()
        cities = await client.get_all_cities()
        if cities:
            return {"cities": cities, "count": len(cities)}
    except Exception as e:
        logger.warning(f"Cassandra get_all_cities error: {e}")

    # Return curated Indian cities if Cassandra is not yet populated
    fallback_cities = [
        "New Delhi", "Mumbai", "Bengaluru", "Kolkata", "Chennai", "Hyderabad",
        "Ahmedabad", "Pune", "Jaipur", "Lucknow", "Patna", "Bhopal", "Chandigarh",
        "Shimla", "Srinagar", "Dehradun", "Bhubaneswar", "Ranchi", "Raipur",
        "Thiruvananthapuram", "Panaji", "Guwahati", "Agartala", "Imphal"
    ]
    return {"cities": fallback_cities, "count": len(fallback_cities)}