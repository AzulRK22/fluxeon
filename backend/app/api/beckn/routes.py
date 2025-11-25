# backend/app/api/beckn/routes.py
"""
Beckn Protocol Callback Endpoints for FLUXEON.
Handles asynchronous responses from the Beckn network.
"""
from fastapi import APIRouter, Request, HTTPException
from typing import Dict, Any
import logging
from datetime import datetime
from app.models.beckn import TransactionStatus

router = APIRouter()
logger = logging.getLogger(__name__)

# ============================================================================
# BECKN CALLBACK ENDPOINTS
# These endpoints receive asynchronous responses from the Beckn Gateway
# ============================================================================

@router.post("/on_search")
async def on_search_callback(request: Request):
    """
    Receives ON_SEARCH responses from ONIX (already validated).
    Extracts DER catalog and updates transaction store.
    """
    try:
        payload = await request.json()
        logger.info(f"Received ON_SEARCH callback from ONIX: {payload.get('context', {}).get('transaction_id')}")
        
        transaction_id = payload.get("context", {}).get("transaction_id")
        
        # Import transaction store from beckn_client
        from app.core.beckn_client import transaction_store, store_lock
        
        # Extract catalog
        catalog = payload.get("message", {}).get("catalog", {})
        providers = catalog.get("providers", [])
        
        # Update transaction store
        async with store_lock:
            if transaction_id in transaction_store:
                transaction_store[transaction_id].response_payload = payload
                transaction_store[transaction_id].status = TransactionStatus.SEARCH_RECEIVED
                logger.info(f"✓ Updated transaction {transaction_id}: {len(providers)} providers")
        
        # TODO: DEMO METRICS - Timestamp returned here is displayed in BecknTimeline.tsx
        # For demo, can inject specific timestamps to show exact timing (e.g., T+0ms, T+120ms, T+250ms, T+345ms)
        return {"message": "ACK", "timestamp": datetime.utcnow().isoformat()}
    except Exception as e:
        logger.error(f"Error processing ON_SEARCH: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/on_select")
async def on_select_callback(request: Request):
    """
    Receives ON_SELECT responses from ONIX with confirmed pricing.
    Extracts quote and updates transaction.
    """
    try:
        payload = await request.json()
        logger.info(f"Received ON_SELECT callback from ONIX")
        
        transaction_id = payload.get("context", {}).get("transaction_id")
        
        from app.core.beckn_client import transaction_store, store_lock
        
        # Extract quote
        quote = payload.get("message", {}).get("order", {}).get("quote", {})
        price = float(quote.get("price", {}).get("value", 0))
        
        # Update transaction
        async with store_lock:
            if transaction_id in transaction_store:
                transaction_store[transaction_id].quoted_price = price
                transaction_store[transaction_id].status = TransactionStatus.SELECT_RECEIVED
                logger.info(f"✓ Quote received: {price}")
        
        return {"message": "ACK", "timestamp": datetime.utcnow().isoformat()}
    except Exception as e:
        logger.error(f"Error processing ON_SELECT: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/on_init")
async def on_init_callback(request: Request):
    """
    Receives ON_INIT responses from ONIX indicating order initialization.
    Updates transaction status.
    """
    try:
        payload = await request.json()
        logger.info(f"Received ON_INIT callback from ONIX")
        
        transaction_id = payload.get("context", {}).get("transaction_id")
        
        from app.core.beckn_client import transaction_store, store_lock
        
        # Update transaction
        async with store_lock:
            if transaction_id in transaction_store:
                transaction_store[transaction_id].status = TransactionStatus.INIT_RECEIVED
                logger.info(f"✓ Order initialized")
        
        return {"message": "ACK", "timestamp": datetime.utcnow().isoformat()}
    except Exception as e:
        logger.error(f"Error processing ON_INIT: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/on_confirm")
async def on_confirm_callback(request: Request):
    """
    Receives ON_CONFIRM responses from ONIX confirming the order.
    **CRITICAL**: Extracts obp_id for P444 audit compliance.
    """
    try:
        payload = await request.json()
        logger.info(f"Received ON_CONFIRM callback from ONIX")
        
        transaction_id = payload.get("context", {}).get("transaction_id")
        
        from app.core.beckn_client import transaction_store, store_lock
        
        # Extract OBP ID (Order/Booking/Payment ID) - CRITICAL for P444
        order_id = payload.get("message", {}).get("order", {}).get("id")
        
        # Update transaction with OBP ID
        async with store_lock:
            if transaction_id in transaction_store:
                transaction_store[transaction_id].obp_id = order_id
                transaction_store[transaction_id].status = TransactionStatus.CONFIRMED
                logger.info(f"✓ ORDER CONFIRMED! OBP ID: {order_id}")
                # TODO: Persist to audit log for P444 compliance
        
        return {"message": "ACK", "timestamp": datetime.utcnow().isoformat()}
    except Exception as e:
        logger.error(f"Error processing ON_CONFIRM: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/on_status")
async def on_status_callback(request: Request):
    """
    Receives ON_STATUS responses with current execution status.
    This is the async response to the STATUS action.
    """
    try:
        payload = await request.json()
        logger.info(f"Received ON_STATUS callback: {payload}")
        
        # TODO: Update transaction status in database
        # TODO: Update dashboard with real-time progress
        
        return {"message": "ACK", "timestamp": datetime.utcnow().isoformat()}
    except Exception as e:
        logger.error(f"Error processing ON_STATUS: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/on_update")
async def on_update_callback(request: Request):
    """
    Receives ON_UPDATE responses when there are changes to the order.
    This is the async response to the UPDATE action.
    """
    try:
        payload = await request.json()
        logger.info(f"Received ON_UPDATE callback: {payload}")
        
        # TODO: Process updates
        # TODO: Notify operator of changes
        
        return {"message": "ACK", "timestamp": datetime.utcnow().isoformat()}
    except Exception as e:
        logger.error(f"Error processing ON_UPDATE: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/on_cancel")
async def on_cancel_callback(request: Request):
    """
    Receives ON_CANCEL responses confirming cancellation.
    This is the async response to the CANCEL action.
    """
    try:
        payload = await request.json()
        logger.info(f"Received ON_CANCEL callback: {payload}")
        
        # TODO: Update transaction status to CANCELLED
        # TODO: Trigger fallback procedures
        
        return {"message": "ACK", "timestamp": datetime.utcnow().isoformat()}
    except Exception as e:
        logger.error(f"Error processing ON_CANCEL: {e}")
        raise HTTPException(status_code=500, detail=str(e))
