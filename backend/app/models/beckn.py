# backend/app/models/beckn.py
"""
Beckn Transaction Models for FLUXEON.
Handles state persistence for asynchronous Beckn protocol interactions.
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, Literal
from datetime import datetime
from enum import Enum

# ============================================================================
# ENUMS
# ============================================================================

class TransactionStatus(str, Enum):
    """Status of a Beckn transaction lifecycle."""
    PENDING = "PENDING"           # Request sent, awaiting response
    SEARCH_RECEIVED = "SEARCH_RECEIVED"
    SELECT_RECEIVED = "SELECT_RECEIVED"
    INIT_RECEIVED = "INIT_RECEIVED"
    CONFIRMED = "CONFIRMED"       # Order confirmed
    IN_PROGRESS = "IN_PROGRESS"   # Execution ongoing
    COMPLETED = "COMPLETED"       # Successfully completed
    CANCELLED = "CANCELLED"       # Cancelled by either party
    FAILED = "FAILED"             # Failed/Error state


class BecknAction(str, Enum):
    """Beckn protocol actions."""
    SEARCH = "search"
    SELECT = "select"
    INIT = "init"
    CONFIRM = "confirm"
    STATUS = "status"
    UPDATE = "update"
    CANCEL = "cancel"


# ============================================================================
# MODELS
# ============================================================================

class BecknTransaction(BaseModel):
    """
    Represents a single Beckn transaction in the system.
    Used to correlate async request-response pairs.
    """
    # Identifiers
    transaction_id: str = Field(..., description="Beckn transaction ID (UUID)")
    message_id: str = Field(..., description="Beckn message ID (UUID)")
    obp_id: Optional[str] = Field(None, description="Order/Booking/Payment ID from provider")
    
    # Context
    feeder_id: str = Field(..., description="Associated feeder ID")
    action: BecknAction = Field(..., description="Current Beckn action")
    status: TransactionStatus = Field(default=TransactionStatus.PENDING, description="Transaction status")
    
    # Timing
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Transaction creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")
    expires_at: Optional[datetime] = Field(None, description="Transaction expiry (TTL)")
    
    # Payload Storage
    request_payload: Optional[Dict[str, Any]] = Field(None, description="Original request payload")
    response_payload: Optional[Dict[str, Any]] = Field(None, description="Latest response payload")
    
    # Business Context
    flexibility_kw: Optional[float] = Field(None, description="Requested flexibility in kW")
    window_start: Optional[datetime] = Field(None, description="Flexibility window start")
    window_end: Optional[datetime] = Field(None, description="Flexibility window end")
    
    # Metadata
    provider_id: Optional[str] = Field(None, description="Selected provider BAP ID")
    provider_name: Optional[str] = Field(None, description="Provider name")
    quoted_price: Optional[float] = Field(None, description="Quoted price for service")
    
    class Config:
        json_schema_extra = {
            "example": {
                "transaction_id": "550e8400-e29b-41d4-a716-446655440000",
                "message_id": "660e8400-e29b-41d4-a716-446655440001",
                "feeder_id": "F1",
                "action": "search",
                "status": "PENDING",
                "flexibility_kw": 50.0,
                "window_start": "2025-11-24T17:00:00Z",
                "window_end": "2025-11-24T18:00:00Z"
            }
        }


class BecknContext(BaseModel):
    """
    Standard Beckn context object.
    Required in all Beckn messages.
    """
    domain: str
    country: str
    city: str
    action: str
    core_version: str
    bap_id: str
    bap_uri: str
    transaction_id: str
    message_id: str
    timestamp: str
    ttl: Optional[str] = "PT10M"  # ISO 8601 duration (10 minutes default)
    
    class Config:
        json_schema_extra = {
            "example": {
                "domain": "energy:flex",
                "country": "ARG",
                "city": "Buenos Aires",
                "action": "search",
                "core_version": "1.1.0",
                "bap_id": "fluxeon-dso-bap-dev",
                "bap_uri": "https://your-ngrok-url.ngrok.io/beckn/callbacks",
                "transaction_id": "550e8400-e29b-41d4-a716-446655440000",
                "message_id": "660e8400-e29b-41d4-a716-446655440001",
                "timestamp": "2025-11-24T17:00:00.000Z",
                "ttl": "PT10M"
            }
        }
