import asyncio
import logging
import time
from typing import Any, Dict, List, Optional
import httpx

from app.config import settings

logger = logging.getLogger(__name__)

# In-memory geocode cache: query -> (results, expiry)
_nominatim_search_cache: Dict[str, tuple[List[Dict[str, Any]], float]] = {}
_nominatim_reverse_cache: Dict[str, tuple[Dict[str, Any], float]] = {}

class NominatimClient:
    """
    OpenStreetMap Nominatim Geocoding and Reverse Geocoding Client.
    Follows Nominatim Usage Policy:
    - Custom descriptive User-Agent
    - Max 1 request per second throttling
    - In-memory result caching
    """
    def __init__(
        self,
        base_url: Optional[str] = None,
        reverse_url: Optional[str] = None,
        user_agent: Optional[str] = None,
    ):
        self.base_url = base_url or settings.nominatim_base_url
        self.reverse_url = reverse_url or settings.nominatim_reverse_url
        self.user_agent = user_agent or settings.nominatim_user_agent
        self._client: Optional[httpx.AsyncClient] = None
        self._last_request_time: float = 0.0
        self._lock = asyncio.Lock()
        self.last_status: Dict[str, Any] = {
            "configured": bool(self.user_agent and self.base_url),
            "last_request_time": None,
            "last_request_success": None,
            "last_error": None,
        }

    async def get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=12.0,
                headers={"User-Agent": self.user_agent, "Accept": "application/json"},
            )
        return self._client

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            self._client = None

    async def _throttle(self):
        """Throttle requests to respect Nominatim 1 req/sec policy"""
        async with self._lock:
            elapsed = time.time() - self._last_request_time
            if elapsed < 1.0:
                await asyncio.sleep(1.0 - elapsed)
            self._last_request_time = time.time()

    async def search(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Search places by text query with caching and rate limiting"""
        cleaned_query = query.strip()
        if not cleaned_query:
            return []

        cache_key = f"{cleaned_query.lower()}:{limit}"
        now = time.time()
        if cache_key in _nominatim_search_cache:
            results, expiry = _nominatim_search_cache[cache_key]
            if now < expiry:
                logger.debug(f"Nominatim search cache hit for '{cleaned_query}'")
                return results

        await self._throttle()
        client = await self.get_client()
        params = {
            "q": cleaned_query,
            "format": "jsonv2",
            "limit": limit,
            "addressdetails": 1,
        }

        try:
            response = await client.get(self.base_url, params=params)
            self.last_status["last_request_time"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            response.raise_for_status()
            raw_results = response.json()
            self.last_status["last_request_success"] = True
            self.last_status["last_error"] = None

            normalized = []
            for item in raw_results:
                name = item.get("name") or item.get("display_name", "").split(",")[0]
                normalized.append({
                    "place_id": item.get("place_id"),
                    "name": name,
                    "display_name": item.get("display_name"),
                    "latitude": float(item.get("lat")),
                    "longitude": float(item.get("lon")),
                    "type": item.get("type", "location"),
                    "category": item.get("category"),
                    "importance": item.get("importance", 0.0),
                    "address": item.get("address", {}),
                })

            _nominatim_search_cache[cache_key] = (normalized, now + settings.cache_ttl_geocode)
            return normalized

        except Exception as e:
            self.last_status["last_request_success"] = False
            self.last_status["last_error"] = str(e)
            logger.error(f"Nominatim search failed for '{cleaned_query}': {e}")
            return []

    async def reverse(self, lat: float, lon: float) -> Optional[Dict[str, Any]]:
        """Reverse geocode coordinates into a human-readable location label"""
        cache_key = f"{round(lat, 4)}:{round(lon, 4)}"
        now = time.time()
        if cache_key in _nominatim_reverse_cache:
            res, expiry = _nominatim_reverse_cache[cache_key]
            if now < expiry:
                return res

        await self._throttle()
        client = await self.get_client()
        params = {
            "lat": f"{lat:.5f}",
            "lon": f"{lon:.5f}",
            "format": "jsonv2",
            "addressdetails": 1,
            "zoom": 14,
        }

        try:
            response = await client.get(self.reverse_url, params=params)
            self.last_status["last_request_time"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            response.raise_for_status()
            item = response.json()
            self.last_status["last_request_success"] = True
            self.last_status["last_error"] = None

            address = item.get("address", {})
            name = (
                address.get("city")
                or address.get("town")
                or address.get("village")
                or address.get("suburb")
                or address.get("county")
                or item.get("name")
                or item.get("display_name", "").split(",")[0]
                or f"Coords ({round(lat, 2)}, {round(lon, 2)})"
            )

            result = {
                "place_id": item.get("place_id"),
                "name": name,
                "display_name": item.get("display_name"),
                "latitude": lat,
                "longitude": lon,
                "type": item.get("type", "location"),
                "address": address,
            }
            _nominatim_reverse_cache[cache_key] = (result, now + settings.cache_ttl_geocode)
            return result
        except Exception as e:
            self.last_status["last_request_success"] = False
            self.last_status["last_error"] = str(e)
            logger.error(f"Nominatim reverse geocode failed for ({lat}, {lon}): {e}")
            return None

# Singleton client
_nominatim_client: Optional[NominatimClient] = None

def get_nominatim_client() -> NominatimClient:
    global _nominatim_client
    if _nominatim_client is None:
        _nominatim_client = NominatimClient()
    return _nominatim_client

async def close_nominatim_client():
    global _nominatim_client
    if _nominatim_client:
        await _nominatim_client.close()
        _nominatim_client = None
