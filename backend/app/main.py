from contextlib import asynccontextmanager
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
from app.config import settings
from app.routers import (
    health_router,
    geocode_router,
    weather_router,
    india_router,
    cassandra_router,
    locations_router,
)
from app.services import (
    close_open_meteo_client,
    close_cassandra_client,
    close_cache_service,
    close_metno_client,
    close_nominatim_client,
    close_stream_manager,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.debug else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("Starting Weatherpulse API with real-data streaming architecture...")
    
    # Initialize cache service (in-memory, Redis removed)
    try:
        from app.services import get_cache_service
        await get_cache_service()
        logger.info("In-memory cache service initialized")
    except Exception as e:
        logger.warning(f"Cache service initialization failed: {e}")
    
    # Initialize MET Norway client
    try:
        from app.services import get_metno_client
        get_metno_client()
        logger.info("MET Norway client initialized")
    except Exception as e:
        logger.warning(f"MET Norway client initialization failed: {e}")

    # Initialize Nominatim client
    try:
        from app.services import get_nominatim_client
        get_nominatim_client()
        logger.info("Nominatim geocoding client initialized")
    except Exception as e:
        logger.warning(f"Nominatim client initialization failed: {e}")

    yield
    
    # Cleanup
    logger.info("Shutting down Weatherpulse API...")
    await close_stream_manager()
    await close_metno_client()
    await close_nominatim_client()
    await close_open_meteo_client()
    await close_cassandra_client()
    await close_cache_service()
    logger.info("Shutdown complete")

app = FastAPI(
    title=settings.app_name,
    description="Interactive Weather Location Selection, MET Norway & Apache Kafka Streaming API",
    version="2.0.0",
    debug=settings.debug,
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc) if settings.debug else None},
    )

# Include API router with /api prefix
api_router = APIRouter(prefix="/api")
api_router.include_router(health_router)
api_router.include_router(geocode_router)
api_router.include_router(weather_router)
api_router.include_router(india_router)
api_router.include_router(cassandra_router)
api_router.include_router(locations_router)
app.include_router(api_router)

# Also include routers at root for backward compatibility
app.include_router(health_router)
app.include_router(geocode_router)
app.include_router(weather_router)
app.include_router(india_router)
app.include_router(cassandra_router)
app.include_router(locations_router)

# Root endpoint
@app.get("/")
async def root():
    return {
        "name": settings.app_name,
        "version": "2.0.0",
        "description": "Interactive Weather Location Selection & Kafka Streaming API",
        "docs": "/docs",
        "health": "/health",
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=settings.debug)