#app/models/feeder.py
"""
CORE ENDPOINT: Returns the real-time state of the feeder.
1. Gets data from Simulator (Sensing).
2. Updates History Buffer.
3. Runs AI Inference (Detection).
4. Returns State (0/1/2) to the Orchestrator.
"""

from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime
from app.models import FeederStateResponse, FeederReading
from app.core.simulator import grid_sim
from app.core.ts_pipeline import ai_brain

router = APIRouter()

# In-memory buffer to simulate "Real-time" history for the AI
# In production, this would be a Redis or Timeseries DB
history_buffer: List[FeederReading] = []

@router.get("/{feeder_id}/state", response_model=FeederStateResponse)
def get_feeder_state(feeder_id: str):

   
    reading = grid_sim.get_reading()  # 1. Sensing (Get current reading)
    
    history_buffer.append(reading) # 2. Update Buffer (Keep last 10 points for context/plotting)
    if len(history_buffer) > 20:
        history_buffer.pop(0)
    
    predicted_risk = ai_brain.predict_risk(history_buffer) # 3. AI Detection where we pass the buffer to the brain to look for patterns
    
    # 4. Naive Forecast (Simple trend projection for UI) & Just projected linear trend of last 2 points
    if len(history_buffer) >= 2:
        slope = history_buffer[-1].load_kw - history_buffer[-2].load_kw
        forecast = history_buffer[-1].load_kw + slope
    else:
        forecast = reading.load_kw
    
    # Message
    msg = "System Stable"
    if predicted_risk == 1: msg = "WARNING: High Load Detected"
    if predicted_risk == 2: msg = "CRITICAL: Overload! Orchestration Required"
        
    return FeederStateResponse(
        feeder_id=feeder_id,
        timestamp=reading.timestamp,
        risk_level=predicted_risk,
        current_load_kw=reading.load_kw,
        forecast_load_kw=forecast,
        message=msg,
        recent_history=history_buffer
    )