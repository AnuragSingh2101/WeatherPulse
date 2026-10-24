from fastapi import APIRouter
from datetime import datetime
from app.models.weather import HealthResponse
from app.services import get_metno_client, get_nominatim_client, get_cache_service

router = APIRouter(prefix="", tags=["health"])

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint for monitoring - non-blocking"""
    services = {}

    # MET Norway status
    try:
        metno = get_metno_client()
        services["met_norway"] = "healthy" if metno.last_status.get("configured") else "unconfigured"
    except Exception as e:
        services["met_norway"] = f"unhealthy: {str(e)}"

    # Nominatim status
    try:
        nom = get_nominatim_client()
        services["nominatim"] = "healthy" if nom.last_status.get("configured") else "unconfigured"
    except Exception as e:
        services["nominatim"] = f"unhealthy: {str(e)}"

    # In-memory cache status (Redis removed)
    try:
        cache = await get_cache_service()
        services["cache"] = "healthy (in-memory)"
    except Exception as e:
        services["cache"] = f"unhealthy: {str(e)}"

    # Cassandra - non-blocking status check
    try:
        from app.services.cassandra_client import _cassandra_client
        if _cassandra_client is not None:
            services["cassandra"] = "healthy"
        else:
            services["cassandra"] = "not_initialized"
    except Exception as e:
        services["cassandra"] = f"unhealthy: {str(e)}"

    overall_status = "healthy" if any(v.startswith("healthy") for v in services.values()) else "degraded"

    return HealthResponse(
        status=overall_status,
        timestamp=datetime.now(),
        services=services,
    )

@router.get("/ready")
async def readiness_check():
    """Readiness check for Kubernetes/Docker - instant response"""
    return {"status": "ready"}

@router.get("/live")
async def liveness_check():
    """Liveness check for Kubernetes/Docker - instant response"""
    return {"status": "alive"}