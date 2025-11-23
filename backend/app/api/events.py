from fastapi import APIRouter

router = APIRouter()

@router.get("/active")
def list_active_events():
    return [
        {
            "event_id": "EVT-001",
            "feeder_id": "F2",
            "status": "CONFIRM",
            "requested_kw": 50,
            "delivered_kw": 42,
        }
    ]