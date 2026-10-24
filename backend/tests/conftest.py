import pytest
import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

@pytest.fixture
def sample_metno_compact_payload():
    return {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": [77.5946, 12.9716, 920]
        },
        "properties": {
            "meta": {
                "updated_at": "2026-10-24T08:00:00Z",
                "units": {
                    "air_pressure_at_sea_level": "hPa",
                    "air_temperature": "celsius",
                    "cloud_area_fraction": "%",
                    "precipitation_amount": "mm",
                    "relative_humidity": "%",
                    "wind_from_direction": "degrees",
                    "wind_speed": "m/s"
                }
            },
            "timeseries": [
                {
                    "time": "2026-10-24T09:00:00Z",
                    "data": {
                        "instant": {
                            "details": {
                                "air_pressure_at_sea_level": 1013.2,
                                "air_temperature": 27.5,
                                "cloud_area_fraction": 42.0,
                                "relative_humidity": 68.0,
                                "wind_from_direction": 180.0,
                                "wind_speed": 3.4
                            }
                        },
                        "next_1_hours": {
                            "summary": { "symbol_code": "partlycloudy_day" },
                            "details": { "precipitation_amount": 0.2 }
                        },
                        "next_6_hours": {
                            "summary": { "symbol_code": "partlycloudy_day" },
                            "details": { "precipitation_amount": 0.5 }
                        }
                    }
                },
                {
                    "time": "2026-10-24T10:00:00Z",
                    "data": {
                        "instant": {
                            "details": {
                                "air_pressure_at_sea_level": 1012.8,
                                "air_temperature": 28.1,
                                "cloud_area_fraction": 35.0,
                                "relative_humidity": 65.0,
                                "wind_from_direction": 190.0,
                                "wind_speed": 4.1
                            }
                        },
                        "next_1_hours": {
                            "summary": { "symbol_code": "fair_day" },
                            "details": { "precipitation_amount": 0.0 }
                        }
                    }
                }
            ]
        }
    }

@pytest.fixture
def sample_nominatim_search_payload():
    return [
        {
            "place_id": 1234567,
            "name": "Bengaluru",
            "display_name": "Bengaluru, Bangalore North, Bengaluru Urban, Karnataka, 560001, India",
            "lat": "12.9715987",
            "lon": "77.5945627",
            "type": "city",
            "importance": 0.88,
            "address": {
                "city": "Bengaluru",
                "state": "Karnataka",
                "country": "India",
                "postcode": "560001"
            }
        },
        {
            "place_id": 9876543,
            "name": "Bangalore Urban",
            "display_name": "Bangalore Urban, Karnataka, India",
            "lat": "12.9800000",
            "lon": "77.6000000",
            "type": "administrative",
            "importance": 0.65,
            "address": {
                "state": "Karnataka",
                "country": "India"
            }
        }
    ]
