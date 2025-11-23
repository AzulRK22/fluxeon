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
    def get_reading(self, timestamp: datetime = None, inject_spikes: bool = True) -> FeederReading:
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
        load += np.random.normal(0, 45) # Increased noise from 25 to 45
        
        # 5. Inject Random Peaks (Fault Simulation)
        if inject_spikes:
            # We need more positive samples for the AI to learn
            rand_val = np.random.random()
            
            # 12% chance of Critical Spike (> 95%)
            if rand_val < 0.12:
                spike_factor = np.random.uniform(0.96, 1.20) # Up to 120% capacity
                load = self.max_capacity_kw * spike_factor
                
            # 10% chance of Warning Spike (85% - 95%)
            elif rand_val < 0.22:
                spike_factor = np.random.uniform(0.86, 0.94)
                load = self.max_capacity_kw * spike_factor
        
        # Determine Risk Label based on physics
        risk = 0
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
        
        # 1. Generate Base Load (Clean)
        for i in range(total_points):
            ts = start_time + timedelta(minutes=i * interval_mins)
            # We use get_reading but force NO random spikes first
            # We will inject them manually later to create "Ramps"
            reading = self.get_reading(ts, inject_spikes=False)
            data.append(reading.dict())
            
        df = pd.DataFrame(data)
        
        # 2. Inject Ramp-up Peaks (Forecasting Precursors)
        # We iterate and inject events every ~20-40 intervals
        i = 0
        while i < len(df) - 10:
            # Randomly decide to inject an event
            if np.random.random() < 0.05: # 5% chance per interval to start an event
                
                # Decide type: Critical (12%) or Warning (10%) - relative to total events
                event_type = np.random.choice(['critical', 'warning', 'none'], p=[0.4, 0.3, 0.3])
                
                if event_type == 'none':
                    i += 1
                    continue
                    
                duration = np.random.randint(3, 7) # Variable duration: 3 to 6 intervals (45m - 1.5h)
                
                # Target Peak Load
                if event_type == 'critical':
                    target_factor = np.random.uniform(1.05, 1.25) # > 100%
                else:
                    target_factor = np.random.uniform(0.88, 0.94) # Warning zone
                
                peak_load = self.max_capacity_kw * target_factor
                
                # Create Ramp
                # We want to go from current load to peak_load in 'duration' steps
                start_load = df.at[i, 'load_kw']
                
                for step in range(duration):
                    if i + step >= len(df): break
                    
                    # Linear interpolation + some noise
                    progress = (step + 1) / duration
                    current_target = start_load + (peak_load - start_load) * progress
                    
                    # Add randomness to the ramp so it's not perfectly linear
                    noise = np.random.normal(0, 35) # Increased ramp noise from 15 to 35
                    new_load = current_target + noise
                    
                    # Update DataFrame
                    df.at[i+step, 'load_kw'] = new_load
                    
                    # Update Risk Label
                    if new_load >= self.max_capacity_kw * self.critical_threshold:
                        df.at[i+step, 'risk_label'] = 2
                    elif new_load >= self.max_capacity_kw * self.warning_threshold:
                        df.at[i+step, 'risk_label'] = 1
                    else:
                        df.at[i+step, 'risk_label'] = 0
                
                i += duration # Skip the event duration
            else:
                i += 1
            
        return df

#--------------------------------------------------------------------------------------------------------------
# Singleton instance
grid_sim = GridSimulator()


#--------------------------------------------------------------------------------------------------------------
if __name__ == "__main__":
    print("--- Simulation Test (5 Readings) ---")
    # Generate 5 readings with 15 min intervals
    start_time = datetime.now()
    for i in range(5):
        t = start_time + timedelta(minutes=15*i)
        reading = grid_sim.get_reading(t)
        print(f"[{reading.timestamp.strftime('%H:%M')}] Load: {reading.load_kw:.2f} kW | Temp: {reading.temperature:.1f}C | Risk: {reading.risk_label}")