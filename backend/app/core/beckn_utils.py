# backend/app/core/beckn_utils.py
"""
Beckn Protocol Utilities for FLUXEON - DEG Hackathon Edition.
Functions to build standard Beckn messages for DEG Hackathon BAP Sandbox API.
"""
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from app.core.config import settings
from app.models.beckn import BecknContext, BecknAction


# ============================================================================
# CONTEXT BUILDERS
# ============================================================================

def build_context(
    action: str,
    domain: Optional[str] = None,
    transaction_id: Optional[str] = None,
    message_id: Optional[str] = None
) -> BecknContext:
    """
    Build a standard Beckn context object for DEG Hackathon API.
    
    Args:
        action: Beckn action (discover, confirm, status, etc.)
        domain: Beckn domain (if None, uses demand-flexibility domain)
        transaction_id: Reuse existing transaction ID or generate new one
        message_id: Reuse existing message ID or generate new one
    
    Returns:
        BecknContext object with DEG Hackathon specifications (version 2.0.0)
    """
    # Use demand-flexibility domain by default
    if domain is None:
        domain = settings.beckn_domain_demand_flexibility
    
    return BecknContext(
        domain=domain,
        country=settings.beckn_country,
        city=settings.beckn_city,
        action=action,
        core_version=settings.beckn_core_version,  # 2.0.0 for DEG Hackathon
        bap_id=settings.bap_id,
        bap_uri=settings.bap_uri,
        transaction_id=transaction_id or str(uuid.uuid4()),
        message_id=message_id or str(uuid.uuid4()),
        timestamp=datetime.utcnow().isoformat() + "Z",
        ttl="PT10M"  # 10 minutes
    )


# ============================================================================
# MESSAGE BUILDERS - DEG Hackathon API
# ============================================================================

def build_discover_message(
    feeder_id: str,
    flexibility_kw: float,
    window_start: datetime,
    window_end: datetime,
    location: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Build a DISCOVER message for DEG Hackathon API (/api/discover endpoint).
    Uses compute-energy domain as per specification.
    
    Args:
        feeder_id: Feeder identifier
        flexibility_kw: Requested flexibility in kW
        window_start: Flexibility window start time
        window_end: Flexibility window end time
        location: Optional location data
    
    Returns:
        Complete Beckn DISCOVER message payload
    """
    # CRITICAL: Use compute-energy domain for discover
    context = build_context(
        action="discover",
        domain=settings.beckn_domain_compute_energy
    )
    
    message = {
        "context": context.model_dump(),
        "message": {
            "intent": {
                "item": {
                    "descriptor": {
                        "code": "DR_EVENT"  # Demand Response Event
                    },
                    "tags": {
                        "flexibility_kw": flexibility_kw,
                        "feeder_id": feeder_id,
                        "flexibility_direction": "reduction"
                    }
                },
                "fulfillment": {
                    "start": {
                        "time": {
                            "timestamp": window_start.isoformat() + "Z"
                        }
                    },
                    "end": {
                        "time": {
                            "timestamp": window_end.isoformat() + "Z"
                        }
                    }
                }
            }
        }
    }
    
    if location:
        message["message"]["intent"]["fulfillment"]["start"]["location"] = location
    
    return message


def build_confirm_message(
    transaction_id: str,
    provider_id: str,
    item_id: str
) -> Dict[str, Any]:
    """
    Build a CONFIRM message for DEG Hackathon API (/api/confirm endpoint).
    Uses demand-flexibility domain as per specification.
    
    Args:
        transaction_id: Existing transaction ID from discover
        provider_id: Selected provider's ID
        item_id: Item ID from previous steps
    
    Returns:
        Complete Beckn CONFIRM payload
    """
    # Uses demand-flexibility domain (default)
    context = build_context(action="confirm", transaction_id=transaction_id)
    
    return {
        "context": context.model_dump(),
        "message": {
            "order": {
                "provider": {
                    "id": provider_id
                },
                "items": [
                    {
                        "id": item_id
                    }
                ]
            }
        }
    }


def build_status_message(
    transaction_id: str,
    order_id: str
) -> Dict[str, Any]:
    """
    Build a STATUS message for DEG Hackathon API (/api/status endpoint).
    Uses demand-flexibility domain as per specification.
    CRITICAL: Reuses transaction_id from confirm.
    
    Args:
        transaction_id: Existing transaction ID (MUST be same as confirm)
        order_id: Order ID (OBP ID) from ON_CONFIRM
    
    Returns:
        Complete Beckn STATUS payload
    """
    # Uses demand-flexibility domain (default)
    context = build_context(action="status", transaction_id=transaction_id)
    
    return {
        "context": context.model_dump(),
        "message": {
            "order_id": order_id
        }
    }


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def extract_transaction_id(payload: Dict[str, Any]) -> Optional[str]:
    """Extract transaction_id from a Beckn payload."""
    try:
        return payload.get("context", {}).get("transaction_id")
    except:
        return None


def extract_message_id(payload: Dict[str, Any]) -> Optional[str]:
    """Extract message_id from a Beckn payload."""
    try:
        return payload.get("context", {}).get("message_id")
    except:
        return None


def validate_context(payload: Dict[str, Any]) -> bool:
    """
    Validate that a payload contains required Beckn context fields.
    
    Returns:
        True if valid, False otherwise
    """
    required_fields = [
        "domain", "country", "city", "action", "core_version",
        "bap_id", "bap_uri", "transaction_id", "message_id", "timestamp"
    ]
    
    context = payload.get("context", {})
    return all(field in context for field in required_fields)
