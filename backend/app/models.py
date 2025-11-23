#app/models.py
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
#--------------------------------------------------------------------------------------------------------------
class FeederReading(BaseModel):
    #feeder sensor - 15min interval
    timestamp: datetime
    load_kw: float          # Current Power in kW
    temperature: float      # Ambient Temperature in Celsius
    is_workday: bool        # Activity Flag (True=Workday, False=Weekend)
    risk_label: int         # 0: Normal, 1: Warning, 2: Critical (Simulated/Predicted)
#--------------------------------------------------------------------------------------------------------------
class FeederStateResponse(BaseModel):
    #api response
    feeder_id: str
    timestamp: datetime
    risk_level: int         # The AI Classification (0, 1, or 2)
    current_load_kw: float
    forecast_load_kw: float # Naive forecast for the next interval
    message: str
    recent_history: List[FeederReading] # Last hour of data for plotting