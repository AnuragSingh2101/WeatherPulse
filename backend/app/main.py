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
)
from app.services import (
    close_open_meteo_client,
    close_cassandra_client,
    close_cache_service,
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
    logger.info("Starting India Weather Map API...")
    
    # Initialize services
    try:
        from app.services import get_open_meteo_client, get_cassandra_client, get_cache_service
        await get_open_meteo_client()
        logger.info("Open-Meteo client initialized")
    except Exception as e:
        logger.warning(f"Open-Meteo client initialization failed: {e}")
    
    try:
        await get_cassandra_client()
        logger.info("Cassandra client initialized")
    except Exception as e:
        logger.warning(f"Cassandra client initialization failed: {e}")
    
    try:
        await get_cache_service()
        logger.info("Cache service initialized")
    except Exception as e:
        logger.warning(f"Cache service initialization failed: {e}")
    
    yield
    
    # Cleanup
    logger.info("Shutting down...")
    await close_open_meteo_client()
    await close_cassandra_client()
    await close_cache_service()
    logger.info("Shutdown complete")

app = FastAPI(
    title=settings.app_name,
    description="Interactive 3D Weather Map of India - Backend API",
    version="1.0.0",
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
app.include_router(api_router)

# Also include routers at root for backward compatibility
app.include_router(health_router)
app.include_router(geocode_router)
app.include_router(weather_router)
app.include_router(india_router)
app.include_router(cassandra_router)

# Root endpoint
@app.get("/")
async def root():
    return {
        "name": settings.app_name,
        "version": "1.0.0",
        "description": "Interactive 3D Weather Map of India - Backend API",
        "docs": "/docs",
        "health": "/health",
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )