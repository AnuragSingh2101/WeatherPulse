import pytest
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.weather_streamer import WeatherStreamManager, LocationInput

@pytest.mark.asyncio
async def test_stream_lifecycle_start_and_stop():
    manager = WeatherStreamManager()
    
    # Mock metno client to avoid live calls in test
    with patch("app.services.weather_streamer.get_metno_client") as mock_get_client:
        mock_client = MagicMock()
        mock_client.fetch_compact_forecast = AsyncMock(return_value={
            "source": "met-no",
            "current": {"air_temperature_c": 25.0, "time": "2026-10-24T10:00:00Z"},
            "forecast_hourly": [{"air_temperature_c": 25.0, "time": "2026-10-24T10:00:00Z"}]
        })
        mock_get_client.return_value = mock_client

        # Start stream
        locations = [LocationInput(name="Delhi", latitude=28.6139, longitude=77.2090)]
        status = await manager.start(locations=locations, fetch_interval=60)

        assert status.is_running is True
        assert len(status.configured_locations) == 1
        assert status.configured_locations[0]["name"] == "Delhi"

        # Let loop run briefly
        await asyncio.sleep(0.1)

        # Stop stream
        stopped_status = await manager.stop()
        assert stopped_status.is_running is False
        assert manager._task is None

@pytest.mark.asyncio
async def test_duplicate_start_prevention():
    manager = WeatherStreamManager()

    with patch("app.services.weather_streamer.get_metno_client") as mock_get_client:
        mock_client = MagicMock()
        mock_client.fetch_compact_forecast = AsyncMock(return_value={
            "source": "met-no",
            "current": {"air_temperature_c": 25.0, "time": "2026-10-24T10:00:00Z"},
            "forecast_hourly": []
        })
        mock_get_client.return_value = mock_client

        locations1 = [LocationInput(name="Mumbai", latitude=19.0760, longitude=72.8777)]
        await manager.start(locations=locations1, fetch_interval=300)
        first_task = manager._task

        # Call start again while running
        locations2 = [LocationInput(name="Pune", latitude=18.5204, longitude=73.8567)]
        second_status = await manager.start(locations=locations2)

        # Verified: Same background task was reused, no duplicate task spawned
        assert manager._task is first_task
        assert second_status.configured_locations[0]["name"] == "Pune"

        await manager.stop()

@pytest.mark.asyncio
async def test_kafka_publication_with_mock_producer():
    manager = WeatherStreamManager()

    mock_producer = MagicMock()
    mock_producer.send = MagicMock()
    mock_producer.flush = MagicMock()

    with patch.object(manager, "_get_producer", return_value=mock_producer), \
         patch("app.services.weather_streamer.get_metno_client") as mock_get_client:

        mock_client = MagicMock()
        mock_client.fetch_compact_forecast = AsyncMock(return_value={
            "source": "met-no",
            "current": {"air_temperature_c": 29.2, "relative_humidity_percent": 75, "time": "2026-10-24T12:00:00Z"},
            "forecast_hourly": [
                {"air_temperature_c": 29.2, "relative_humidity_percent": 75, "time": "2026-10-24T12:00:00Z"}
            ]
        })
        mock_get_client.return_value = mock_client

        locations = [LocationInput(name="Kolkata", latitude=22.5726, longitude=88.3639)]
        await manager.start(locations=locations, fetch_interval=60)
        await asyncio.sleep(0.15)
        await manager.stop()

        # Check producer.send was called
        assert mock_producer.send.called
        call_args = mock_producer.send.call_args
        topic = call_args[0][0]
        record = call_args[1]["value"]

        assert topic == manager.topic
        assert record["source"] == "met-no"
        assert record["location"]["name"] == "Kolkata"
        assert record["weather"]["temperature_c"] == 29.2
