from fastapi import APIRouter
from app.core.simulator import grid_sim
from datetime import datetime, timedelta

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
    """Returns current state of a specific feeder with real-time data and historical points"""
    
    # Generate current reading
    current_time = datetime.now()
    reading = grid_sim.get_reading(current_time)
    
    # Generate historical data points (last 6 hours, 15-minute intervals = 24 points)
    history = []
    for i in range(24, 0, -1):
        past_time = current_time - timedelta(minutes=15 * i)
        past_reading = grid_sim.get_reading(past_time, inject_spikes=False)
        history.append({
            "timestamp": past_reading.timestamp.isoformat(),
            "load_kw": past_reading.load_kw,
            "temperature": past_reading.temperature,
            "is_workday": past_reading.is_workday,
            "risk_label": past_reading.risk_label
        })
    
    # Generate forecast (next 4 points = 1 hour ahead)
    forecast = []
    for i in range(1, 5):
        future_time = current_time + timedelta(minutes=15 * i)
        future_reading = grid_sim.get_reading(future_time, inject_spikes=False)
        forecast.append(future_reading.load_kw)
    
    return {
        "feeder_id": feeder_id,
        "timestamp": reading.timestamp.isoformat(),
        "risk_level": reading.risk_label,
        "current_load_kw": reading.load_kw,
        "forecast_load_kw": forecast[0] if forecast else None,
        "threshold_kw": grid_sim.max_capacity_kw * grid_sim.warning_threshold,
        "critical_threshold_kw": grid_sim.max_capacity_kw * grid_sim.critical_threshold,
        "recent_history": history,
        "forecast_kw": forecast,
        "message": f"Feeder {feeder_id} operating normally" if reading.risk_label == 0 else f"Feeder {feeder_id} in alert state"
    }