from .health import router as health_router
from .geocode import router as geocode_router
from .weather import router as weather_router
from .india import router as india_router
from .cassandra import router as cassandra_router
from .locations import router as locations_router

__all__ = [
    "health_router",
    "geocode_router", 
    "weather_router",
    "india_router",
    "cassandra_router",
    "locations_router",
]