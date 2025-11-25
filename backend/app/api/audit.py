from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.core.beckn_client import transaction_store

router = APIRouter()

@router.get("/recent")
async def get_recent_transactions():
    """Get all recent transactions for aggregated audit view"""
    all_logs = []
    
    # Get all transactions from the store
    for txn in transaction_store.values():
        entries = []
        
        # Build entries from history
        for event in txn.history:
            entries.append({
                "ts": event.get("timestamp"),
                "message": event.get("message"),
                "latency_ms": event.get("latency_ms")
            })
            
        # If transaction failed externally, ensure we have an entry for it
        if txn.status == "FAILURE_EXTERNAL":
            latency = txn.metrics.get("latency_attempt", 0)
            error_msg = txn.metrics.get("error", "Unknown error")
            if not any("FAILURE" in e["message"] for e in entries):
                entries.append({
                    "ts": txn.created_at.isoformat() if txn.created_at else "2025-11-25T00:00:00Z",
                    "message": f"FAILURE_EXTERNAL: {error_msg}",
                    "latency_ms": latency
                })
        
        if entries:  # Only include transactions with history
            all_logs.append({
                "obp_id": txn.obp_id or f"OBP-{txn.transaction_id[:8]}",
                "entries": entries
            })
    
    return all_logs

@router.get("/{obp_id}")
async def get_audit_log(obp_id: str):
    # Try to find transaction by OBP ID or Transaction ID
    # Frontend sends "OBP-<uuid>" which might be the transaction ID if OBP ID is missing
    target_txn = None
    
    # 1. Search by OBP ID (exact match)
    for txn in transaction_store.values():
        if txn.obp_id == obp_id:
            target_txn = txn
            break
            
    # 2. If not found, check if obp_id is actually a transaction ID (or "OBP-<txn_id>")
    if not target_txn:
        clean_id = obp_id.replace("OBP-", "")
        target_txn = transaction_store.get(clean_id)
        
    if not target_txn:
        # Return empty/mock if not found (or 404, but frontend might prefer empty)
        return {
            "obp_id": obp_id,
            "entries": []
        }
        
    # Build entries from history
    entries = []
    for event in target_txn.history:
        entries.append({
            "ts": event.get("timestamp"),
            "message": event.get("message"),
            "latency_ms": event.get("latency_ms") # Pass latency if available
        })
        
    # If transaction failed externally, ensure we have an entry for it
    if target_txn.status == "FAILURE_EXTERNAL":
        latency = target_txn.metrics.get("latency_attempt", 0)
        error_msg = target_txn.metrics.get("error", "Unknown error")
        # Check if already added
        if not any("FAILURE" in e["message"] for e in entries):
            entries.append({
                "ts": target_txn.metrics.get("timestamp", "2025-11-25T00:00:00Z"), # Fallback
                "message": f"FAILURE_EXTERNAL: {error_msg}",
                "latency_ms": latency
            })

    return {
        "obp_id": target_txn.obp_id or "FALLA EXTERNA",
        "entries": entries,
        "latency_ms": target_txn.metrics.get("latency_attempt") # Top level latency
    }