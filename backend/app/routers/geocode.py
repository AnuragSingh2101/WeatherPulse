from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from app.models.weather import GeocodeResult, GeocodeResponse
from app.services import get_open_meteo_client

router = APIRouter(prefix="/geocode", tags=["geocoding"])

@router.get("", response_model=List[GeocodeResult])
async def geocode(
    q: str = Query(..., description="Search query for location", min_length=2),
    limit: int = Query(10, ge=1, le=50, description="Maximum number of results"),
    country: str = Query("IN", description="Country code to restrict search"),
):
    """
    Search for locations using Open-Meteo geocoding API.
    Returns matching cities, towns, and locations in India.
    """
    client = await get_open_meteo_client()
    results = await client.geocode(q, limit, country)
    return results

@router.get("/reverse", response_model=List[GeocodeResult])
async def reverse_geocode(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    limit: int = Query(1, ge=1, le=10, description="Number of results"),
):
    """
    Reverse geocode coordinates to location name.
    """
    client = await get_open_meteo_client()
    results = await client.reverse_geocode(lat, lon, limit)
    return results