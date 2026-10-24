import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, patch, MagicMock
from app.main import app

@pytest.mark.asyncio
async def test_locations_search_endpoint(sample_nominatim_search_payload):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        with patch("app.services.nominatim.NominatimClient.search", new_callable=AsyncMock) as mock_search:
            mock_search.return_value = [
                {
                    "place_id": 123,
                    "name": "Bengaluru",
                    "display_name": "Bengaluru, Karnataka, India",
                    "latitude": 12.9716,
                    "longitude": 77.5946,
                    "type": "city",
                    "address": {"city": "Bengaluru"}
                }
            ]

            response = await ac.get("/api/locations/search?q=Bengaluru&limit=5")
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            assert len(data) == 1
            assert data[0]["name"] == "Bengaluru"
            assert data[0]["latitude"] == 12.9716

@pytest.mark.asyncio
async def test_weather_forecast_endpoint_success(sample_metno_compact_payload):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        with patch("app.services.met_norway.METNorwayClient.fetch_compact_forecast", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.return_value = {
                "source": "met-no",
                "location": {"latitude": 12.97, "longitude": 77.59},
                "current": {
                    "time": "2026-10-24T10:00:00Z",
                    "air_temperature_c": 28.5,
                    "relative_humidity_percent": 70,
                    "wind_speed_mps": 3.2,
                    "wind_direction_degrees": 180,
                    "condition": "Partly Cloudy",
                },
                "forecast_hourly": [
                    {
                        "time": "2026-10-24T10:00:00Z",
                        "air_temperature_c": 28.5,
                        "relative_humidity_percent": 70,
                    }
                ],
            }

            response = await ac.get("/api/weather/forecast?lat=12.97&lon=77.59")
            assert response.status_code == 200
            data = response.json()
            assert data["source"] == "met-no"
            assert data["current"]["air_temperature_c"] == 28.5
            assert "hourly" in data  # backward compatibility array

@pytest.mark.asyncio
async def test_weather_forecast_endpoint_invalid_coordinates():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Latitude 120 is out of bounds [-90, 90]
        response = await ac.get("/api/weather/forecast?lat=120.0&lon=77.59")
        assert response.status_code == 422  # FastAPI validation error

@pytest.mark.asyncio
async def test_weather_health_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/weather/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "providers" in data
        assert "met_norway" in data["providers"]
        assert "nominatim" in data["providers"]
        assert "streaming" in data

@pytest.mark.asyncio
async def test_weather_stream_endpoints_lifecycle():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Check initial status
        res_status = await ac.get("/api/weather/stream/status")
        assert res_status.status_code == 200
        status_data = res_status.json()
        assert "is_running" in status_data

        # Start stream
        res_start = await ac.post(
            "/api/weather/stream/start",
            json={
                "location": {"name": "Bengaluru", "latitude": 12.9716, "longitude": 77.5946},
                "fetch_interval_seconds": 120
            }
        )
        assert res_start.status_code == 200
        start_data = res_start.json()
        assert start_data["is_running"] is True

        # Stop stream
        res_stop = await ac.post("/api/weather/stream/stop")
        assert res_stop.status_code == 200
        stop_data = res_stop.json()
        assert stop_data["is_running"] is False
