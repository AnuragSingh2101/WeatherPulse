from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    app_name: str = "India Weather Map API"
    debug: bool = True
    host: str = "0.0.0.0"
    port: int = 8000

    # Open-Meteo
    open_meteo_base_url: str = "https://api.open-meteo.com/v1"
    open_meteo_geocoding_url: str = "https://geocoding-api.open-meteo.com/v1"

    # Cassandra
    cassandra_hosts: str = "localhost"
    cassandra_port: int = 9042
    cassandra_keyspace: str = "spark_streams"
    cassandra_username: str = "cassandra"
    cassandra_password: str = "cassandra"

    # MET Norway API
    metno_base_url: str = "https://api.met.no/weatherapi/locationforecast/2.0/compact"
    metno_user_agent: str = "WeatherPulse/1.0 (https://github.com/AnuragSingh2101/WeatherPulse; anuragsingh2101@users.noreply.github.com)"

    # OpenStreetMap Nominatim Geocoding API
    nominatim_base_url: str = "https://nominatim.openstreetmap.org/search"
    nominatim_reverse_url: str = "https://nominatim.openstreetmap.org/reverse"
    nominatim_user_agent: str = "WeatherPulse/1.0 (https://github.com/AnuragSingh2101/WeatherPulse; anuragsingh2101@users.noreply.github.com)"

    # Apache Kafka
    kafka_bootstrap_servers: str = "localhost:9092"
    kafka_topic_weather: str = "weather-events"
    weather_fetch_interval_seconds: int = 300

    # Cache TTL (In-Memory RFC 7234 compliant caching for rate limiting protection)
    cache_ttl_current: int = 600
    cache_ttl_forecast: int = 1800
    cache_ttl_historical: int = 3600
    cache_ttl_geocode: int = 300

    # CORS - parse comma-separated string to list
    cors_origins: str = "http://localhost:3000,http://localhost:5173"
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def kafka_bootstrap_servers_list(self) -> List[str]:
        return [s.strip() for s in self.kafka_bootstrap_servers.split(",") if s.strip()]

    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()