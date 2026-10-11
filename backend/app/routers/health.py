from fastapi import APIRouter
from datetime import datetime
from app.models.weather import HealthResponse
import asyncio

router = APIRouter(prefix="", tags=["health"])

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint for monitoring - non-blocking"""
    from app.services import get_open_meteo_client, get_cassandra_client, get_cache_service
    from app.config import settings
    
    services = {}
    
    # Check Open-Meteo (with short timeout)
    try:
        client = await get_open_meteo_client()
        await asyncio.wait_for(client.geocode("Delhi", limit=1), timeout=5.0)
        services["open_meteo"] = "healthy"
    except Exception as e:
        services["open_meteo"] = f"unhealthy: {str(e)}"
    
    # Check Cassandra - just report status without blocking on connection
    try:
        # Use cached client if available
        from app.services.cassandra_client import _cassandra_client
        if _cassandra_client is not None:
            services["cassandra"] = "healthy"
        else:
            services["cassandra"] = "not_initialized"
    except Exception as e:
        services["cassandra"] = f"unhealthy: {str(e)}"
    
    # Check Cache - just report status without blocking on connection
    try:
        from app.services.cache import _cache_service
        if _cache_service is not None:
            services["cache"] = "healthy"
        else:
            services["cache"] = "not_initialized"
    except Exception as e:
        services["cache"] = f"unhealthy: {str(e)}"
    
    overall_status = "healthy" if all(v == "healthy" for v in services.values()) else "degraded"
    
    from app.models.weather import HealthResponse
    return HealthResponse(
        status=overall_status,
        timestamp=datetime.now(),
        services=services,
    )

@router.get("/ready")
async def readiness_check():
    """Readiness check for Kubernetes - instant response"""
    return {"status": "ready"}

@router.get("/live")
async def liveness_check():
    """Liveness check for Kubernetes - instant response"""
    return {"status": "alive"}