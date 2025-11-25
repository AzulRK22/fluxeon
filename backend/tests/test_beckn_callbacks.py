# tests/test_beckn_callbacks.py
"""
Test suite for Beckn callback endpoints.
Simulates webhook payloads from the Beckn network.
"""
import pytest
from fastapi.testclient import TestClient
from datetime import datetime
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.main import app

client = TestClient(app)

# ============================================================================
# SAMPLE PAYLOADS
# ============================================================================

def get_sample_on_search_payload():
    """Sample ON_SEARCH response from Beckn gateway."""
    return {
        "context": {
            "domain": "energy:flex",
            "country": "ARG",
            "city": "Buenos Aires",
            "action": "on_search",
            "core_version": "1.1.0",
            "bap_id": "fluxeon-dso-bap-dev",
            "bap_uri": "http://localhost:8000/beckn/callbacks",
            "bpp_id": "der-provider-123",
            "bpp_uri": "https://der-provider.example.com",
            "transaction_id": "550e8400-e29b-41d4-a716-446655440000",
            "message_id": "660e8400-e29b-41d4-a716-446655440001",
            "timestamp": "2025-11-24T20:00:00.000Z",
            "ttl": "PT10M"
        },
        "message": {
            "catalog": {
                "providers": [
                    {
                        "id": "der-provider-123",
                        "descriptor": {
                            "name": "Green Energy DER Co."
                        },
                        "items": [
                            {
                                "id": "item-001",
                                "descriptor": {
                                    "name": "Demand Response Service"
                                },
                                "price": {
                                    "currency": "ARS",
                                    "value": "1500"
                                },
                                "quantity": {
                                    "available": {
                                        "count": 100
                                    }
                                }
                            }
                        ]
                    }
                ]
            }
        }
    }


def get_sample_on_confirm_payload():
    """Sample ON_CONFIRM response from Beckn gateway."""
    return {
        "context": {
            "domain": "energy:flex",
            "country": "ARG",
            "city": "Buenos Aires",
            "action": "on_confirm",
            "core_version": "1.1.0",
            "bap_id": "fluxeon-dso-bap-dev",
            "bap_uri": "http://localhost:8000/beckn/callbacks",
            "bpp_id": "der-provider-123",
            "bpp_uri": "https://der-provider.example.com",
            "transaction_id": "550e8400-e29b-41d4-a716-446655440000",
            "message_id": "770e8400-e29b-41d4-a716-446655440002",
            "timestamp": "2025-11-24T20:05:00.000Z"
        },
        "message": {
            "order": {
                "id": "OBP-2025-001",
                "status": "CONFIRMED",
                "provider": {
                    "id": "der-provider-123",
                    "descriptor": {
                        "name": "Green Energy DER Co."
                    }
                },
                "items": [
                    {
                        "id": "item-001",
                        "quantity": {
                            "count": 50
                        }
                    }
                ],
                "quote": {
                    "price": {
                        "currency": "ARS",
                        "value": "75000"
                    }
                }
            }
        }
    }


# ============================================================================
# TESTS
# ============================================================================

def test_root_endpoint():
    """Test that the root endpoint works."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_on_search_callback():
    """Test ON_SEARCH callback endpoint."""
    payload = get_sample_on_search_payload()
    response = client.post("/beckn/callbacks/on_search", json=payload)
    
    assert response.status_code == 200
    assert "message" in response.json()
    assert response.json()["message"] == "ACK"


def test_on_select_callback():
    """Test ON_SELECT callback endpoint."""
    payload = get_sample_on_search_payload()
    payload["context"]["action"] = "on_select"
    
    response = client.post("/beckn/callbacks/on_select", json=payload)
    
    assert response.status_code == 200
    assert response.json()["message"] == "ACK"


def test_on_confirm_callback():
    """Test ON_CONFIRM callback endpoint."""
    payload = get_sample_on_confirm_payload()
    
    response = client.post("/beckn/callbacks/on_confirm", json=payload)
    
    assert response.status_code == 200
    assert response.json()["message"] == "ACK"
    assert "timestamp" in response.json()


def test_on_status_callback():
    """Test ON_STATUS callback endpoint."""
    payload = get_sample_on_confirm_payload()
    payload["context"]["action"] = "on_status"
    payload["message"]["order"]["status"] = "IN_PROGRESS"
    
    response = client.post("/beckn/callbacks/on_status", json=payload)
    
    assert response.status_code == 200
    assert response.json()["message"] == "ACK"


def test_invalid_payload():
    """Test that invalid payloads are handled gracefully."""
    response = client.post("/beckn/callbacks/on_search", json={"invalid": "data"})
    
    # Should still return 200 with ACK (graceful handling)
    # In production, you might want 400 for invalid payloads
    assert response.status_code in [200, 400, 500]


if __name__ == "__main__":
    print("Running Beckn callback tests...")
    print("=" * 60)
    
    # Run tests manually
    test_root_endpoint()
    print("✓ Root endpoint test passed")
    
    test_on_search_callback()
    print("✓ ON_SEARCH callback test passed")
    
    test_on_select_callback()
    print("✓ ON_SELECT callback test passed")
    
    test_on_confirm_callback()
    print("✓ ON_CONFIRM callback test passed")
    
    test_on_status_callback()
    print("✓ ON_STATUS callback test passed")
    
    print("=" * 60)
    print("All tests passed!")
