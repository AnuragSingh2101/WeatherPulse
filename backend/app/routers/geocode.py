from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from app.models.weather import GeocodeResult, GeocodeResponse
from app.services import get_open_meteo_client

from app.routers.india import INDIAN_STATES, DISTRICTS_BY_STATE

router = APIRouter(prefix="/geocode", tags=["geocoding"])

@router.get("", response_model=List[GeocodeResult])
async def geocode(
    q: str = Query(..., description="Search query for location", min_length=1),
    limit: int = Query(10, ge=1, le=50, description="Maximum number of results"),
    country: str = Query("IN", description="Country code to restrict search"),
):
    """
    Search for locations using Open-Meteo geocoding API with local Indian state and district matching.
    Returns matching cities, towns, and locations in India.
    """
    q_clean = q.strip()
    if not q_clean:
        return []

    client = await get_open_meteo_client()
    results = await client.geocode(q_clean, limit, country)

    # Prepend matching Indian states and districts for instant accuracy
    q_lower = q_clean.lower()
    local_matches: List[GeocodeResult] = []

    for state in INDIAN_STATES:
        if q_lower == state["code"].lower() or q_lower in state["name"].lower():
            local_matches.append(
                GeocodeResult(
                    id=abs(hash(state["code"])) % 10000000 + 8000000,
                    name=state["name"],
                    latitude=state["center"]["lat"],
                    longitude=state["center"]["lon"],
                    country="India",
                    country_code="IN",
                    admin1=state["name"],
                    feature_code="ADM1",
                    timezone="Asia/Kolkata",
                )
            )

    for state_code, districts in DISTRICTS_BY_STATE.items():
        state_match = next((s["name"] for s in INDIAN_STATES if s["code"] == state_code), state_code)
        for dist in districts:
            if q_lower in dist["name"].lower() or q_lower == dist.get("code", "").lower():
                local_matches.append(
                    GeocodeResult(
                        id=abs(hash(dist.get("code", dist["name"]))) % 10000000 + 9000000,
                        name=dist["name"],
                        latitude=dist["lat"],
                        longitude=dist["lon"],
                        country="India",
                        country_code="IN",
                        admin1=state_match,
                        feature_code="ADM2",
                        timezone="Asia/Kolkata",
                    )
                )

    # Deduplicate while preserving priority
    seen_names = set()
    final_results: List[GeocodeResult] = []
    for item in local_matches + results:
        key = (item.name.lower(), round(item.latitude, 2), round(item.longitude, 2))
        if key not in seen_names:
            seen_names.add(key)
            final_results.append(item)

    return final_results[:limit]

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