from fastapi import APIRouter

router = APIRouter()

@router.get("")
def list_feeders():
    return [
        {"id": "F1", "name": "Feeder 1", "state": 0, "load_kw": 120.5},
        {"id": "F2", "name": "Feeder 2", "state": 1, "load_kw": 230.0},
    ]

@router.get("/{feeder_id}/state")
def feeder_state(feeder_id: str):
    return {
        "id": feeder_id,
        "state": 1,
        "load_kw": 230.0,
        "threshold_kw": 200.0,
        "forecast_kw": [210, 220, 230],
    }