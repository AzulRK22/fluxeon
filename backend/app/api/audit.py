from fastapi import APIRouter

router = APIRouter()

@router.get("/{obp_id}")
def get_audit_log(obp_id: str):
    return {
        "obp_id": obp_id,
        "entries": [
            {"ts": "2025-11-22T10:00:00Z", "message": "DISCOVER called"},
            {"ts": "2025-11-22T10:00:02Z", "message": "SELECT completed"},
        ],
    }