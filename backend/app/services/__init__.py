from .open_meteo import get_open_meteo_client, close_open_meteo_client, OpenMeteoClient
from .cassandra_client import get_cassandra_client, close_cassandra_client, CassandraClient
from .cache import get_cache_service, close_cache_service, CacheService
from .met_norway import get_metno_client, close_metno_client, METNorwayClient
from .nominatim import get_nominatim_client, close_nominatim_client, NominatimClient
from .weather_streamer import get_stream_manager, close_stream_manager, WeatherStreamManager

__all__ = [
    "get_open_meteo_client",
    "close_open_meteo_client",
    "OpenMeteoClient",
    "get_cassandra_client",
    "close_cassandra_client",
    "CassandraClient",
    "get_cache_service",
    "close_cache_service",
    "CacheService",
    "get_metno_client",
    "close_metno_client",
    "METNorwayClient",
    "get_nominatim_client",
    "close_nominatim_client",
    "NominatimClient",
    "get_stream_manager",
    "close_stream_manager",
    "WeatherStreamManager",
]