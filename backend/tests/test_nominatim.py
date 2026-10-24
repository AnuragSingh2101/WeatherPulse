import pytest
from unittest.mock import AsyncMock, patch, MagicMock
import httpx
from app.services.nominatim import NominatimClient, _nominatim_search_cache, _nominatim_reverse_cache

@pytest.mark.asyncio
async def test_nominatim_search_success(sample_nominatim_search_payload):
    client = NominatimClient()
    _nominatim_search_cache.clear()

    mock_resp = MagicMock(spec=httpx.Response)
    mock_resp.status_code = 200
    mock_resp.json.return_value = sample_nominatim_search_payload
    mock_resp.raise_for_status = MagicMock()

    with patch.object(httpx.AsyncClient, "get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_resp
        results = await client.search("Bengaluru", limit=2)

        assert len(results) == 2
        assert results[0]["name"] == "Bengaluru"
        assert results[0]["latitude"] == 12.9715987
        assert results[0]["longitude"] == 77.5945627
        assert results[0]["address"]["city"] == "Bengaluru"

@pytest.mark.asyncio
async def test_nominatim_search_empty_and_no_results():
    client = NominatimClient()
    _nominatim_search_cache.clear()

    # Empty string should return empty without making network call
    res_empty = await client.search("   ")
    assert res_empty == []

    # No matches from Nominatim
    mock_resp = MagicMock(spec=httpx.Response)
    mock_resp.status_code = 200
    mock_resp.json.return_value = []
    mock_resp.raise_for_status = MagicMock()

    with patch.object(httpx.AsyncClient, "get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_resp
        results = await client.search("xyznonexistentplace123", limit=5)
        assert results == []

@pytest.mark.asyncio
async def test_nominatim_reverse_geocode_success():
    client = NominatimClient()
    _nominatim_reverse_cache.clear()

    mock_resp = MagicMock(spec=httpx.Response)
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "place_id": 445566,
        "name": "Indiranagar",
        "display_name": "Indiranagar, Bengaluru, Karnataka, India",
        "lat": "12.9784",
        "lon": "77.6408",
        "type": "suburb",
        "address": {
            "suburb": "Indiranagar",
            "city": "Bengaluru",
            "state": "Karnataka"
        }
    }
    mock_resp.raise_for_status = MagicMock()

    with patch.object(httpx.AsyncClient, "get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_resp
        result = await client.reverse(12.9784, 77.6408)

        assert result is not None
        assert result["name"] == "Bengaluru" or result["name"] == "Indiranagar"
        assert result["latitude"] == 12.9784
        assert result["longitude"] == 77.6408
