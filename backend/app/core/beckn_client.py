# backend/app/core/beckn_client.py
"""
Beckn HTTP Client and Orchestrator for FLUXEON.
Communicates with Beckn-ONIX adapter (localhost:8081).
ONIX handles all protocol complexity: signatures, validation, routing.
"""
import httpx
import asyncio
import uuid
import time
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
import logging

from app.core.config import settings
from app.core import beckn_utils
from app.models.beckn import BecknTransaction, TransactionStatus, BecknAction

logger = logging.getLogger(__name__)

# ============================================================================
# IN-MEMORY TRANSACTION STORE
# ============================================================================

# Shared transaction store for correlating async request-response pairs
transaction_store: Dict[str, BecknTransaction] = {}
store_lock = asyncio.Lock()


# ============================================================================
# BECKN CLIENT (via ONIX)
# ============================================================================

class BecknClient:
    """
    HTTP client for DEG Hackathon BAP Sandbox API.
    
    CRITICAL CHANGES:
    - Base URL: https://deg-hackathon-bap-sandbox.becknprotocol.io
    - Endpoints: /api/discover, /api/confirm, /api/status
    - Version: 2.0.0
    - Dynamic domains: compute-energy for discover, demand-flexibility for confirm/status
    """
    
    def __init__(self):
        # DEG Hackathon BAP Sandbox URL
        self.sandbox_url = settings.beckn_bap_sandbox_url
        self.onix_url = settings.onix_url
        self.timeout = httpx.Timeout(30.0, connect=10.0)
        
    async def send_discover(
        self,
        feeder_id: str,
        flexibility_kw: float,
        window_start: datetime,
        window_end: datetime
    ) -> BecknTransaction:
        """
        Send DISCOVER request to DEG Hackathon BAP Sandbox (/api/discover).
        Uses compute-energy domain.
        Returns transaction object - caller must wait for async callback.
        """
        # Build message with compute-energy domain
        payload = beckn_utils.build_discover_message(
            feeder_id=feeder_id,
            flexibility_kw=flexibility_kw,
            window_start=window_start,
            window_end=window_end
        )
        
        transaction_id = payload["context"]["transaction_id"]
        
        # Create transaction record
        transaction = BecknTransaction(
            transaction_id=transaction_id,
            message_id=payload["context"]["message_id"],
            feeder_id=feeder_id,
            action=BecknAction.SEARCH,  # Keep internal naming
            status=TransactionStatus.PENDING,
            flexibility_kw=flexibility_kw,
            window_start=window_start,
            window_end=window_end,
            request_payload=payload
        )
        
        # Store transaction
        async with store_lock:
            transaction_store[transaction_id] = transaction
        
        # Send to DEG Hackathon BAP Sandbox
        start_time = time.time()
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    f"{self.sandbox_url}/api/discover",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )
                response.raise_for_status()
                logger.info(f"✓ DISCOVER sent to BAP Sandbox for transaction {transaction_id}")
                
            # Response should be empty ACK or minimal
                # Real data comes via async callback to bap_uri
            except Exception as e:
                latency_ms = (time.time() - start_time) * 1000
                logger.error(f"✗ DISCOVER failed after {latency_ms:.2f}ms: {e}")
                
                # Update transaction state
                transaction.status = TransactionStatus.FAILURE_EXTERNAL
                transaction.metrics["latency_attempt"] = latency_ms
                transaction.metrics["error"] = str(e)
                
                # We don't raise here because we want to return the transaction with the failure status
                # so the orchestrator can report it properly instead of crashing
                return transaction
                # raise  <-- Removed re-raise to allow graceful failure reporting
        
        return transaction
    
    async def send_select(
        self,
        transaction_id: str,
        provider_id: str,
        item_id: str,
        flexibility_kw: float
    ) -> None:
        """Send SELECT request via ONIX to get quote from specific provider."""
        payload = beckn_utils.build_select_message(
            transaction_id=transaction_id,
            provider_id=provider_id,
            item_id=item_id,
            flexibility_kw=flexibility_kw
        )
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    f"{self.onix_url}/bap/caller/select",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )
                response.raise_for_status()
                logger.info(f"✓ SELECT sent via ONIX for transaction {transaction_id}")
            except Exception as e:
                logger.error(f"✗ SELECT failed: {e}")
                raise
    
    async def send_init(
        self,
        transaction_id: str,
        provider_id: str,
        item_id: str
    ) -> None:
        """Send INIT request via ONIX to initialize order."""
        payload = beckn_utils.build_init_message(
            transaction_id=transaction_id,
            provider_id=provider_id,
            item_id=item_id
        )
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    f"{self.onix_url}/bap/caller/init",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )
                response.raise_for_status()
                logger.info(f"✓ INIT sent via ONIX for transaction {transaction_id}")
            except Exception as e:
                logger.error(f"✗ INIT failed: {e}")
                raise
    
    async def send_confirm(
        self,
        transaction_id: str,
        provider_id: str,
        item_id: str
    ) -> None:
        """
        Send CONFIRM request to DEG Hackathon BAP Sandbox (/api/confirm).
        Uses demand-flexibility domain.
        """
        payload = beckn_utils.build_confirm_message(
            transaction_id=transaction_id,
            provider_id=provider_id,
            item_id=item_id
        )
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    f"{self.sandbox_url}/api/confirm",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )
                response.raise_for_status()
                logger.info(f"✓ CONFIRM sent to BAP Sandbox for transaction {transaction_id}")
            except Exception as e:
                logger.error(f"✗ CONFIRM failed: {e}")
                raise
    
    async def send_status(
        self,
        transaction_id: str,
        order_id: str
    ) -> None:
        """
        Send STATUS request to DEG Hackathon BAP Sandbox (/api/status).
        Uses demand-flexibility domain.
        CRITICAL: Reuses transaction_id from confirm.
        """
        payload = beckn_utils.build_status_message(
            transaction_id=transaction_id,
            order_id=order_id
        )
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    f"{self.sandbox_url}/api/status",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )
                response.raise_for_status()
                logger.info(f"✓ STATUS sent to BAP Sandbox for transaction {transaction_id}")
            except Exception as e:
                logger.error(f"✗ STATUS failed: {e}")
                raise


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def select_best_der(providers: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """
    Rank DER providers and select the best one.
    
    Criteria:
    1. Price (lower is better)
    2. Availability (higher capacity is better)
    3. Provider reputation (simulated for now)
    
    Returns:
        Selected provider dict with 'provider_id' and 'item_id'
    """
    if not providers:
        return None
    
    best_provider = None
    best_score = float('-inf')
    
    for provider in providers:
        try:
            # Extract provider info
            provider_id = provider.get("id")
            items = provider.get("items", [])
            
            if not items:
                continue
            
            # Analyze first item (simplification)
            item = items[0]
            item_id = item.get("id")
            
            # Extract price
            price_value = float(item.get("price", {}).get("value", 999999))
            
            # Extract available capacity
            available_kw = float(
                item.get("quantity", {}).get("available", {}).get("count", 0)
            )
            
            # Score calculation (normalized 0-1):
            # Lower price is better, higher availability is better
            price_score = 1.0 / (1.0 + price_value / 1000.0)  # Normalize
            capacity_score = min(available_kw / 100.0, 1.0)  # Cap at 1.0
            
            # Weighted score
            total_score = (0.6 * price_score) + (0.4 * capacity_score)
            
            logger.info(
                f"Provider {provider_id}: price={price_value}, "
                f"capacity={available_kw} kW, score={total_score:.3f}"
            )
            
            if total_score > best_score:
                best_score = total_score
                best_provider = {
                    "provider_id": provider_id,
                    "item_id": item_id,
                    "price": price_value,
                    "capacity": available_kw
                }
        except Exception as e:
            logger.warning(f"Error evaluating provider: {e}")
            continue
    
    return best_provider


async def wait_for_callback(
    transaction_id: str,
    expected_status: TransactionStatus,
    timeout_seconds: int = 60
) -> bool:
    """
    Wait for callback to update transaction to expected status.
    Returns True if status reached, False if timeout.
    """
    start_time = asyncio.get_event_loop().time()
    
    while True:
        async with store_lock:
            transaction = transaction_store.get(transaction_id)
            if transaction and transaction.status == expected_status:
                return True
        
        # Check timeout
        elapsed = asyncio.get_event_loop().time() - start_time
        if elapsed >= timeout_seconds:
            logger.warning(f"Timeout waiting for {expected_status}")
            return False
        
        # Wait before checking again
        await asyncio.sleep(0.5)


# ============================================================================
# ORCHESTRATOR
# ============================================================================

async def run_agent(
    feeder_id: str,
    risk_level: int,
    flexibility_kw: float,
    window_start: datetime,
    window_end: datetime
) -> Dict[str, Any]:
    """
    Main orchestrator: Executes complete Beckn flow via ONIX.
    
    Flow:
    1. SEARCH - Discover DER providers (via ONIX)
    2. Wait for ON_SEARCH callbacks (from ONIX)
    3. SELECT - Choose best provider (via ONIX)
    4. Wait for ON_SELECT (quote)
    5. INIT - Initialize order (via ONIX)
    6. Wait for ON_INIT
    7. CONFIRM - Finalize order (via ONIX)
    8. Wait for ON_CONFIRM (get obp_id for P444)
    
    Returns:
        Complete transaction result with obp_id
    """
    client = BecknClient()
    
    logger.info("=" * 70)
    logger.info(f"🚀 FLUXEON BECKN ORCHESTRATOR (DEG Hackathon)")
    logger.info(f"Feeder: {feeder_id}, Risk: {risk_level}, Flexibility: {flexibility_kw} kW")
    logger.info("=" * 70)
    
    # Step 1: DISCOVER (replaces SEARCH in DEG Hackathon API)
    logger.info("\n[1/3] Sending DISCOVER to BAP Sandbox...")
    transaction = await client.send_discover(
        feeder_id=feeder_id,
        flexibility_kw=flexibility_kw,
        window_start=window_start,
        window_end=window_end
    )
    transaction_id = transaction.transaction_id
    
    # Log start
    async with store_lock:
        transaction.history.append({
            "timestamp": datetime.utcnow().isoformat(),
            "message": f"DISCOVER -> Sent request for {flexibility_kw}kW"
        })
        
    # Check for immediate failure (e.g. timeout)
    if transaction.status == TransactionStatus.FAILURE_EXTERNAL:
        latency = transaction.metrics.get("latency_attempt", 0)
        return {
            "status": "failed", 
            "error": f"Sandbox Timeout. Agent was ready in {latency:.2f}ms",
            "latency_ms": latency,
            "transaction_id": transaction_id
        }
    
    # Step 2: Wait for async callback (ON_DISCOVER)
    logger.info("[1/3] Waiting for async ON_DISCOVER callback...")
    success = await wait_for_callback(
        transaction_id,
        TransactionStatus.SEARCH_RECEIVED,  # Keep internal status naming
        timeout_seconds=60
    )
    
    if not success:
        # Check if it failed externally during send_discover
        if transaction.status == TransactionStatus.FAILURE_EXTERNAL:
            latency = transaction.metrics.get("latency_attempt", 0)
            return {
                "status": "failed", 
                "error": f"Sandbox Timeout. Agent was ready in {latency:.2f}ms",
                "latency_ms": latency,
                "transaction_id": transaction_id
            }
        return {"error": "ON_SEARCH timeout", "transaction_id": transaction_id}
    
    # Extract providers from ON_SEARCH
    async with store_lock:
        catalog = transaction.response_payload.get("message", {}, {}).get("catalog", {})
        providers = catalog.get("providers", [])
        
        transaction.history.append({
            "timestamp": datetime.utcnow().isoformat(),
            "message": f"ON_DISCOVER -> Found {len(providers)} DER providers"
        })
    
    logger.info(f"✓ Received {len(providers)} providers")
    
    # Step 3: SELECT best DER
    logger.info("\n[2/4] Selecting best DER provider...")
    selected = select_best_der(providers)
    
    if not selected:
        return {"error": "No suitable providers found", "transaction_id": transaction_id}
    
    logger.info(
        f"✓ Selected: {selected['provider_id']} "
        f"(price={selected['price']}, capacity={selected['capacity']} kW)"
    )
    
    await client.send_select(
        transaction_id=transaction_id,
        provider_id=selected["provider_id"],
        item_id=selected["item_id"],
        flexibility_kw=flexibility_kw
    )
    
    # Wait for ON_SELECT
    logger.info("[2/4] Waiting for ON_SELECT (quote) from ONIX...")
    success = await wait_for_callback(
        transaction_id,
        TransactionStatus.SELECT_RECEIVED,
        timeout_seconds=60
    )
    
    if not success:
        return {"error": "ON_SELECT timeout", "transaction_id": transaction_id}
    
    async with store_lock:
        transaction.history.append({
            "timestamp": datetime.utcnow().isoformat(),
            "message": f"ON_SELECT -> Quote received from {selected['provider_id']}"
        })

    logger.info("✓ Quote received")
    
    # Step 4: INIT
    logger.info("\n[3/4] Sending INIT via ONIX...")
    await client.send_init(
        transaction_id=transaction_id,
        provider_id=selected["provider_id"],
        item_id=selected["item_id"]
    )
    
    # Wait for ON_INIT
    logger.info("[3/4] Waiting for ON_INIT from ONIX...")
    success = await wait_for_callback(
        transaction_id,
        TransactionStatus.INIT_RECEIVED,
        timeout_seconds=60
    )
    
    if not success:
        return {"error": "ON_INIT timeout", "transaction_id": transaction_id}
    
    async with store_lock:
        transaction.history.append({
            "timestamp": datetime.utcnow().isoformat(),
            "message": "ON_INIT -> Order initialized"
        })

    logger.info("✓ Order initialized")
    
    # Step 5: CONFIRM
    logger.info("\n[4/4] Sending CONFIRM via ONIX...")
    await client.send_confirm(
        transaction_id=transaction_id,
        provider_id=selected["provider_id"],
        item_id=selected["item_id"]
    )
    
    # Wait for ON_CONFIRM
    logger.info("[4/4] Waiting for ON_CONFIRM (obp_id) from ONIX...")
    success = await wait_for_callback(
        transaction_id,
        TransactionStatus.CONFIRMED,
        timeout_seconds=60
    )
    
    if not success:
        return {"error": "ON_CONFIRM timeout", "transaction_id": transaction_id}
    
    # Extract obp_id for P444 compliance
    async with store_lock:
        obp_id = transaction.obp_id
        transaction.history.append({
            "timestamp": datetime.utcnow().isoformat(),
            "message": f"ON_CONFIRM -> Order confirmed. OBP ID: {obp_id}"
        })
    
    logger.info(f"✓ ORDER CONFIRMED! OBP ID: {obp_id}")
    logger.info("=" * 70)
    
    # Calculate total latency if available
    total_latency = transaction.metrics.get("latency_attempt", 0)
    if total_latency == 0:
        # Fallback calculation if not recorded
        total_latency = (datetime.utcnow() - transaction.created_at).total_seconds() * 1000 if hasattr(transaction, 'created_at') else 0

    return {
        "success": True,
        "transaction_id": transaction_id,
        "obp_id": obp_id,
        "provider_id": selected["provider_id"],
        "flexibility_kw": flexibility_kw,
        "window_start": window_start.isoformat(),
        "window_end": window_end.isoformat(),
        "latency_ms": total_latency
    }


# ============================================================================
# CLI TEST (for manual testing)
# ============================================================================

if __name__ == "__main__":
    import sys
    
    # Mock test
    async def test_orchestrator():
        from datetime import datetime, timedelta
        
        now = datetime.utcnow()
        window_start = now + timedelta(minutes=15)
        window_end = now + timedelta(minutes=75)
        
        result = await run_agent(
            feeder_id="F1",
            risk_level=2,
            flexibility_kw=50.0,
            window_start=window_start,
            window_end=window_end
        )
        
        print("\nFinal Result:")
        print(result)
    
    asyncio.run(test_orchestrator())
