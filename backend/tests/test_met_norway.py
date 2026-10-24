import pytest
from unittest.mock import AsyncMock, patch, MagicMock
import httpx
from app.services.met_norway import METNorwayClient, _forecast_memory_cache

@pytest.mark.asyncio
async def test_fetch_compact_forecast_success(sample_metno_compact_payload):
    client = METNorwayClient(base_url="https://api.met.no/weatherapi/locationforecast/2.0/compact")
    _forecast_memory_cache.clear()

    mock_response = MagicMock(spec=httpx.Response)
    mock_response.status_code = 200
    mock_response.json.return_value = sample_metno_compact_payload
    mock_response.headers = {
        "expires": "Sat, 24 Oct 2026 12:00:00 GMT",
        "last-modified": "Sat, 24 Oct 2026 08:00:00 GMT",
    }
    mock_response.raise_for_status = MagicMock()

    with patch.object(httpx.AsyncClient, "get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_response
        result = await client.fetch_compact_forecast(12.9716, 77.5946)

        assert result["source"] == "met-no"
        assert result["location"]["latitude"] == 12.9716
        assert result["location"]["longitude"] == 77.5946
        assert result["current"]["air_temperature_c"] == 27.5
        assert result["current"]["relative_humidity_percent"] == 68.0
        assert result["current"]["wind_speed_mps"] == 3.4
        assert result["current"]["precipitation_mm"] == 0.2
        assert result["current"]["symbol_code"] == "partlycloudy_day"
        assert result["current"]["condition"] == "Partly Cloudy"
        assert len(result["forecast_hourly"]) == 2

@pytest.mark.asyncio
async def test_fetch_compact_forecast_missing_optional_fields():
    """Verify missing measurements are parsed as None rather than assuming zero."""
    client = METNorwayClient()
    _forecast_memory_cache.clear()

    minimal_payload = {
        "properties": {
            "meta": {"updated_at": "2026-10-24T08:00:00Z"},
            "timeseries": [
                {
                    "time": "2026-10-24T09:00:00Z",
                    "data": {
                        "instant": {
                            "details": {
                                "air_temperature": 22.0
                                # Missing relative_humidity, wind_speed, etc.
                            }
                        }
                        # Missing next_1_hours, next_6_hours
                    }
                }
            ]
        }
    }

    mock_response = MagicMock(spec=httpx.Response)
    mock_response.status_code = 200
    mock_response.json.return_value = minimal_payload
    mock_response.headers = {}
    mock_response.raise_for_status = MagicMock()

    with patch.object(httpx.AsyncClient, "get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_response
        result = await client.fetch_compact_forecast(28.6139, 77.2090)

        assert result["current"]["air_temperature_c"] == 22.0
        assert result["current"]["relative_humidity_percent"] is None
        assert result["current"]["wind_speed_mps"] is None
        assert result["current"]["precipitation_mm"] is None
        assert result["current"]["symbol_code"] is None
        assert result["current"]["condition"] == "Fair"

@pytest.mark.asyncio
async def test_fetch_compact_forecast_upstream_http_error():
    client = METNorwayClient()
    _forecast_memory_cache.clear()

    req = httpx.Request("GET", "https://api.met.no/weatherapi/locationforecast/2.0/compact")
    resp = httpx.Response(502, request=req, text="Bad Gateway")

    with patch.object(httpx.AsyncClient, "get", new_callable=AsyncMock) as mock_get:
        mock_get.side_effect = httpx.HTTPStatusError("Bad Gateway", request=req, response=resp)

        with pytest.raises(httpx.HTTPStatusError):
            await client.fetch_compact_forecast(19.0760, 72.8777)

@pytest.mark.asyncio
async def test_fetch_compact_forecast_timeout():
    client = METNorwayClient()
    _forecast_memory_cache.clear()

    with patch.object(httpx.AsyncClient, "get", new_callable=AsyncMock) as mock_get:
        mock_get.side_effect = httpx.TimeoutException("Connection timed out")

        with pytest.raises(httpx.TimeoutException):
            await client.fetch_compact_forecast(19.0760, 72.8777)

@pytest.mark.asyncio
async def test_fetch_compact_forecast_conditional_304_cache_hit(sample_metno_compact_payload):
    """Verify HTTP 304 Not Modified reuses cached forecast without re-downloading."""
    client = METNorwayClient()
    _forecast_memory_cache.clear()

    # Step 1: Initial successful fetch
    mock_initial = MagicMock(spec=httpx.Response)
    mock_initial.status_code = 200
    mock_initial.json.return_value = sample_metno_compact_payload
    mock_initial.headers = {
        "expires": "Sat, 24 Oct 2026 08:05:00 GMT",
        "last-modified": "Sat, 24 Oct 2026 08:00:00 GMT",
    }
    mock_initial.raise_for_status = MagicMock()

    with patch.object(httpx.AsyncClient, "get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_initial
        initial_res = await client.fetch_compact_forecast(12.9716, 77.5946)
        assert initial_res["current"]["air_temperature_c"] == 27.5

    # Step 2: Make cache expired in time, trigger conditional request returning 304
    cache_key = "12.9716:77.5946"
    _forecast_memory_cache[cache_key]["expires"] = 0.0  # Force expiry

    mock_304 = MagicMock(spec=httpx.Response)
    mock_304.status_code = 304
    mock_304.headers = {"expires": "Sat, 24 Oct 2026 12:00:00 GMT"}
    mock_304.raise_for_status = MagicMock()

    with patch.object(httpx.AsyncClient, "get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_304
        cached_res = await client.fetch_compact_forecast(12.9716, 77.5946)

        # Verified that 304 returned the cached data
        assert cached_res["current"]["air_temperature_c"] == 27.5
        # Check If-Modified-Since header was sent
        mock_get.assert_called_once()
        sent_headers = mock_get.call_args[1].get("headers", {})
        assert "If-Modified-Since" in sent_headers

@pytest.mark.live_api
@pytest.mark.asyncio
async def test_live_met_norway_integration():
    """Optional integration test verifying live connectivity to MET Norway API."""
    client = METNorwayClient()
    try:
        data = await client.fetch_compact_forecast(12.97, 77.59, force_refresh=True)
        assert data["source"] == "met-no"
        assert "air_temperature_c" in data["current"]
        assert len(data["forecast_hourly"]) > 0
    finally:
        await client.close()
