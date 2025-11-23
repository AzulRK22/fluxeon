from fastapi import APIRouter
from app.core.simulator import grid_sim
from datetime import datetime

router = APIRouter()

@router.get("")
def list_feeders():
    """Returns list of feeders with real-time simulated data"""
    # Generate readings for multiple feeders
    reading1 = grid_sim.get_reading()
    reading2 = grid_sim.get_reading()
    
    return [
        {
            "id": "F1", 
            "name": "Feeder 1", 
            "state": reading1.risk_label, 
            "load_kw": reading1.load_kw,
            "temperature": reading1.temperature
        },
        {
            "id": "F2", 
            "name": "Feeder 2", 
            "state": reading2.risk_label, 
            "load_kw": reading2.load_kw,
            "temperature": reading2.temperature
        },
    ]

@router.get("/{feeder_id}/state")
def feeder_state(feeder_id: str):
    """Returns current state of a specific feeder with real-time data"""
    reading = grid_sim.get_reading()
    
    return {
        "id": feeder_id,
        "state": reading.risk_label,
        "load_kw": reading.load_kw,
        "temperature": reading.temperature,
        "threshold_kw": grid_sim.max_capacity_kw * grid_sim.warning_threshold,
        "critical_threshold_kw": grid_sim.max_capacity_kw * grid_sim.critical_threshold,
        "timestamp": reading.timestamp.isoformat(),
        "is_workday": reading.is_workday
    }