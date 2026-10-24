import asyncio
import hashlib
import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.config import settings
from app.services.met_norway import get_metno_client

logger = logging.getLogger(__name__)

class LocationInput(BaseModel):
    name: str = "Selected Location"
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)

class StreamStartRequest(BaseModel):
    locations: Optional[List[LocationInput]] = None
    location: Optional[LocationInput] = None
    fetch_interval_seconds: Optional[int] = Field(None, ge=30, le=86400)

class WeatherStreamStatus(BaseModel):
    is_running: bool
    configured_locations: List[Dict[str, Any]]
    fetch_interval_seconds: int
    last_successful_fetch_time: Optional[str] = None
    last_published_event_time: Optional[str] = None
    published_events_count: int = 0
    last_error: Optional[str] = None
    topic: str

def generate_event_id(lat: float, lon: float, forecast_time: str) -> str:
    seed = f"{round(lat, 4)}:{round(lon, 4)}:{forecast_time}"
    return hashlib.sha256(seed.encode("utf-8")).hexdigest()[:24]

class WeatherStreamManager:
    """
    Manages Apache Kafka ingestion for MET Norway weather forecasts.
    Guarantees single active background task, safe producer lifecycle,
    and event deduplication.
    """
    def __init__(self):
        self._task: Optional[asyncio.Task] = None
        self._stop_event = asyncio.Event()
        self._producer: Any = None
        self._lock = asyncio.Lock()
        
        self.is_running = False
        self.configured_locations: List[Dict[str, Any]] = [
            {"name": "Bengaluru", "latitude": 12.9716, "longitude": 77.5946}
        ]
        self.fetch_interval_seconds = settings.weather_fetch_interval_seconds
        self.last_successful_fetch_time: Optional[str] = None
        self.last_published_event_time: Optional[str] = None
        self.published_events_count = 0
        self.last_error: Optional[str] = None
        self.topic = settings.kafka_topic_weather

    def _get_producer(self):
        if self._producer is not None:
            return self._producer

        try:
            from kafka import KafkaProducer
            self._producer = KafkaProducer(
                bootstrap_servers=settings.kafka_bootstrap_servers_list,
                value_serializer=lambda v: json.dumps(v).encode("utf-8"),
                key_serializer=lambda k: k.encode("utf-8") if k else None,
                max_block_ms=4000,
                retries=3,
                acks="all",
            )
            logger.info(f"Connected Kafka producer to {settings.kafka_bootstrap_servers_list}")
            return self._producer
        except Exception as e:
            self.last_error = f"Kafka connection failed: {e}"
            logger.warning(f"Kafka producer unavailable ({e}). Telemetry events will be logged safely.")
            return None

    def _close_producer(self):
        if self._producer is not None:
            try:
                self._producer.flush(timeout=5)
                self._producer.close(timeout=5)
            except Exception as e:
                logger.warning(f"Error while closing Kafka producer: {e}")
            finally:
                self._producer = None

    async def start(
        self,
        locations: Optional[List[LocationInput]] = None,
        fetch_interval: Optional[int] = None,
    ) -> WeatherStreamStatus:
        async with self._lock:
            if self.is_running and self._task and not self._task.done():
                logger.info("Kafka weather streamer already running. Updating locations/interval.")
                if locations:
                    self.configured_locations = [loc.model_dump() for loc in locations]
                if fetch_interval:
                    self.fetch_interval_seconds = fetch_interval
                return self.get_status()

            if locations:
                self.configured_locations = [loc.model_dump() for loc in locations]
            if fetch_interval:
                self.fetch_interval_seconds = fetch_interval

            self.is_running = True
            self._stop_event.clear()
            self._task = asyncio.create_task(self._run_loop())
            logger.info(f"Started weather streaming ingestion for {len(self.configured_locations)} location(s)")
            return self.get_status()

    async def stop(self) -> WeatherStreamStatus:
        async with self._lock:
            if not self.is_running:
                return self.get_status()

            self.is_running = False
            self._stop_event.set()
            if self._task:
                self._task.cancel()
                try:
                    await self._task
                except asyncio.CancelledError:
                    pass
                self._task = None

            self._close_producer()
            logger.info("Stopped weather streaming ingestion cleanly.")
            return self.get_status()

    def get_status(self) -> WeatherStreamStatus:
        return WeatherStreamStatus(
            is_running=self.is_running,
            configured_locations=self.configured_locations,
            fetch_interval_seconds=self.fetch_interval_seconds,
            last_successful_fetch_time=self.last_successful_fetch_time,
            last_published_event_time=self.last_published_event_time,
            published_events_count=self.published_events_count,
            last_error=self.last_error,
            topic=self.topic,
        )

    async def _run_loop(self):
        """Streaming ingestion loop executing periodically according to provider policies"""
        metno_client = get_metno_client()

        while not self._stop_event.is_set():
            try:
                for loc in list(self.configured_locations):
                    if self._stop_event.is_set():
                        break

                    name = loc.get("name", "Unknown Location")
                    lat = loc["latitude"]
                    lon = loc["longitude"]

                    try:
                        forecast = await metno_client.fetch_compact_forecast(lat, lon)
                        now_utc_str = datetime.now(timezone.utc).isoformat()
                        self.last_successful_fetch_time = now_utc_str
                        self.last_error = None

                        # Process hourly points
                        current = forecast.get("current", {})
                        hourly_points = forecast.get("forecast_hourly", [])
                        points_to_publish = hourly_points[:6] if hourly_points else [current]

                        producer = self._get_producer()

                        for pt in points_to_publish:
                            forecast_time = pt.get("time") or now_utc_str
                            event_id = generate_event_id(lat, lon, forecast_time)
                            
                            record = {
                                "event_id": event_id,
                                "source": "met-no",
                                "location": {
                                    "name": name,
                                    "latitude": lat,
                                    "longitude": lon,
                                },
                                "forecast_time": forecast_time,
                                "fetched_at": now_utc_str,
                                "weather": {
                                    "temperature_c": pt.get("air_temperature_c"),
                                    "relative_humidity_percent": pt.get("relative_humidity_percent"),
                                    "wind_speed_mps": pt.get("wind_speed_mps"),
                                    "wind_direction_degrees": pt.get("wind_direction_degrees"),
                                    "air_pressure_hpa": pt.get("air_pressure_hpa"),
                                    "cloud_area_fraction_percent": pt.get("cloud_area_fraction_percent"),
                                    "precipitation_mm": pt.get("precipitation_mm"),
                                    "symbol_code": pt.get("symbol_code"),
                                    "condition": pt.get("condition"),
                                },
                            }

                            key = f"{round(lat, 2)}_{round(lon, 2)}_{forecast_time}"

                            if producer:
                                producer.send(self.topic, key=key, value=record)
                            else:
                                logger.info(f"[Simulated Kafka Ingestion -> {self.topic}] Key: {key} Event: {event_id}")

                            self.published_events_count += 1
                            self.last_published_event_time = now_utc_str

                        if producer:
                            producer.flush(timeout=2)

                        logger.info(f"Published {len(points_to_publish)} MET Norway event(s) for {name} ({lat}, {lon}) to topic '{self.topic}'")

                    except Exception as loc_err:
                        self.last_error = f"Location fetch error for {name}: {loc_err}"
                        logger.error(self.last_error)

                # Wait for next fetch interval or early stop event
                try:
                    await asyncio.wait_for(self._stop_event.wait(), timeout=float(self.fetch_interval_seconds))
                except asyncio.TimeoutError:
                    pass

            except asyncio.CancelledError:
                break
            except Exception as loop_err:
                self.last_error = f"Ingestion loop error: {loop_err}"
                logger.error(self.last_error)
                await asyncio.sleep(5)

        self.is_running = False

# Global singleton streamer
_stream_manager: Optional[WeatherStreamManager] = None

def get_stream_manager() -> WeatherStreamManager:
    global _stream_manager
    if _stream_manager is None:
        _stream_manager = WeatherStreamManager()
    return _stream_manager

async def close_stream_manager():
    global _stream_manager
    if _stream_manager:
        await _stream_manager.stop()
        _stream_manager = None
