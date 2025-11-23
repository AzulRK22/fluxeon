"""
This program simulates a Low Voltage (LV) Feeder in London (e.g., Islington area).
Generates realistic daily load curves and injects random demand spikes.
"""
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from app.models import FeederReading
class GridSimulator:
    # Configuration aligned with UK Power Networks
    def __init__(self):
        self.max_capacity_kw = 1500.0 
        self.warning_threshold = 0.85  # 1275 kW
        self.critical_threshold = 0.95 # 1425 kW
        # Simulation State
        self.current_time = datetime.now()
        self.data_buffer = [] # Stores recent history
#--------------------------------------------------------------------------------------------------------------
    def _generate_base_load(self, decimal_hour: float, is_workday: bool) -> float:
        """Generates sinusoidal wave for daily consumption."""
        # Morning peak (8 AM) and Evening peak (6 PM)
        morning_curve = 0.4 * np.sin(2 * np.pi * (decimal_hour - 8) / 16)
        evening_curve = 0.35 * np.sin(2 * np.pi * (decimal_hour - 18) / 24)
        # Base load calculation
        base = (morning_curve + evening_curve + 1.5) * (self.max_capacity_kw * 0.3)
        # After midnight curve (00:00 - 06:00) - Low consumption
        if decimal_hour < 6:
            # Smooth curve: lowest at 3 AM, rising to normal by 6 AM
            night_factor = 1.0 - 0.5 * np.exp(-((decimal_hour - 3) ** 2) / 3)
            base *= night_factor
        # Weekend consumption is typically lower
        if not is_workday:
            base *= 0.85
        return max(base, 100.0) # Minimum load floor
#--------------------------------------------------------------------------------------------------------------
    def get_reading(self, timestamp: datetime = None) -> FeederReading:
       #single reading-single timestamp
        if timestamp is None:
            timestamp = datetime.now()
        decimal_hour = timestamp.hour + (timestamp.minute / 60.0)
        is_workday = timestamp.weekday() < 5
        
        # 1. Calculate Base Load
        load = self._generate_base_load(decimal_hour, is_workday)
        
        # 2. Simulate Temperature (Simpler model: colder at night, warmer at noon)
        # London approx range: 5C to 20C
        temp = 12 + 5 * np.sin(2 * np.pi * (decimal_hour - 14) / 24)
        temp += np.random.normal(0, 1.0) # Add noise
        
        # 3. Temperature sensitivity (Heating/AC effect)
        if temp < 8: # Heating
            load *= 1.1
        
        # 4. Add Grid Noise
        load += np.random.normal(0, 25)
        
        # 5. Inject Random Peaks (with fault simulation and 2% chance of a critical spike happening right now
        risk = 0
        if np.random.random() < 0.02:
            spike_factor = np.random.uniform(0.96, 1.15) # Up to 115% capacity
            load = self.max_capacity_kw * spike_factor
        
        # Determine Risk Label based on physics
        if load >= self.max_capacity_kw * self.critical_threshold:
            risk = 2
        elif load >= self.max_capacity_kw * self.warning_threshold:
            risk = 1
            
        return FeederReading(
            timestamp=timestamp,
            load_kw=round(load, 2),
            temperature=round(temp, 1),
            is_workday=is_workday,
            risk_label=risk
        )
#--------------------------------------------------------------------------------------------------------------
    def generate_history(self, days=30, interval_mins=15) -> pd.DataFrame:
        """Generates a large dataset for training the AI model."""
        data = []
        start_time = datetime.now() - timedelta(days=days)
        total_points = int(days * 24 * 60 / interval_mins)
        
        print(f"Generating {total_points} data points for training...")
        
        for i in range(total_points):
            ts = start_time + timedelta(minutes=i * interval_mins)
            reading = self.get_reading(ts)
            data.append(reading.dict())
            
        return pd.DataFrame(data)
#--------------------------------------------------------------------------------------------------------------
# Singleton instance
grid_sim = GridSimulator()