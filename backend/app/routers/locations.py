from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional, Dict, Any
from app.services.nominatim import get_nominatim_client

router = APIRouter(prefix="/locations", tags=["locations"])

@router.get("/search")
async def search_locations(
    q: str = Query(..., description="Location name or place search query", min_length=1),
    limit: int = Query(5, ge=1, le=20, description="Max search results to return"),
) -> List[Dict[str, Any]]:
    """
    Search for places, cities, and landmarks worldwide using OpenStreetMap Nominatim.
    Centralized backend request to adhere to OSM usage policies, identifying User-Agent,
    and automatic in-memory throttling and caching.
    """
    cleaned = q.strip()
    if not cleaned:
        return []

    client = get_nominatim_client()
    try:
        results = await client.search(cleaned, limit=limit)
        return results
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Location geocoding service unavailable: {str(e)}")

@router.get("/reverse")
async def reverse_geocode_location(
    lat: float = Query(..., ge=-90, le=90, description="Latitude"),
    lon: float = Query(..., ge=-180, le=180, description="Longitude"),
) -> Dict[str, Any]:
    """
    Reverse geocode latitude and longitude into human-readable place name.
    """
    client = get_nominatim_client()
    try:
        result = await client.reverse(lat, lon)
        if not result:
            return {
                "name": f"Location ({round(lat, 2)}, {round(lon, 2)})",
                "display_name": f"Coordinates {round(lat, 4)}, {round(lon, 4)}",
                "latitude": lat,
                "longitude": lon,
            }
        return result
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Reverse geocode lookup failed: {str(e)}")
