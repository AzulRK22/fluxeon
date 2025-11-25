from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import feeders, events, audit
from .api.beckn import routes as beckn_routes
import logging

logger = logging.getLogger(__name__)

app = FastAPI(title="FLUXEON Backend - DEG Hackathon", version="0.2.0")

# CORS: permitir frontend en 3000
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(feeders.router, prefix="/feeders", tags=["feeders"])
app.include_router(events.router, prefix="/events", tags=["events"])
app.include_router(audit.router, prefix="/audit", tags=["audit"])
app.include_router(beckn_routes.router, prefix="/beckn/webhook", tags=["beckn"])

# ============================================================================
# TEST ENDPOINTS (DEG Hackathon)
# ============================================================================

@app.post("/test/discover")
async def test_discover():
    """
    Test endpoint to manually trigger the discover flow.
    Use this to test connectivity with DEG Hackathon BAP Sandbox.
    
    Example:
        curl -X POST http://localhost:8000/test/discover
    """
    from app.core.beckn_client import run_agent
    from datetime import datetime, timedelta
    
    logger.info("🧪 TEST: Manual discover trigger")
    
    now = datetime.utcnow()
    try:
        result = await run_agent(
            feeder_id="F1-TEST",
            risk_level=2,
            flexibility_kw=50.0,
            window_start=now + timedelta(minutes=15),
            window_end=now + timedelta(minutes=75)
        )
        return result
    except Exception as e:
        logger.error(f"Test discover failed: {e}")
        return {"error": str(e), "status": "failed"}

# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.get("/")
def root():
    return {"status": "ok", "service": "fluxeon-backend", "version": "0.2.0"}

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "fluxeon-backend",
        "beckn_integration": "DEG Hackathon BAP Sandbox"
    }