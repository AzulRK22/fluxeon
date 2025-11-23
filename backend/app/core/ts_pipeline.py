"""
The AI Brain of the Agent. It Handles Feature Extraction -> Scaling -> Inference.
Predicts risk level (0, 1, 2) based on the last 4 readings (1 hour).
"""
import joblib
import numpy as np
import os
from app.models import FeederReading

# Paths setup
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, '../../data/models/flux_model.pkl')
SCALER_PATH = os.path.join(BASE_DIR, '../../data/models/scaler.pkl')

#--------------------------------------------------------------------------------------------------------------
class TSPipeline:

    def __init__(self):
        self.model = None
        self.scaler = None
        self.load_model()

    def load_model(self):
        """Loads the pre-trained artifacts."""
        try:
            if os.path.exists(MODEL_PATH):
                self.model = joblib.load(MODEL_PATH)
                self.scaler = joblib.load(SCALER_PATH)
                print("✓ FLUXORAX AI Model loaded successfully.")
            else:
                print(f"✗ CRITICAL ERROR: Model not found at {MODEL_PATH}")
                print("  Please run 'python -m app.core.agent_core' to train the model first.")
                self.model = None
        except Exception as e:
            print(f"✗ Error loading model: {e}")
            self.model = None

#--------------------------------------------------------------------------------------------------------------
    def predict_risk(self, history_window: list[FeederReading]) -> int:
        """
        Predicts risk level based on the last 4 readings.
        Returns: 0 (Normal), 1 (Warning), or 2 (Critical)
        """
        if self.model is None:
            raise RuntimeError("AI Model is not loaded. Cannot make predictions. Train the model first.")

        if len(history_window) < 4:
            print("⚠ Insufficient data for prediction (need 4 readings). Returning 0 (Normal).")
            return 0

        # 1. Extract Features (Same logic as trainer)
        window = history_window[-4:]  # We take the last 4 readings
        
        loads = np.array([r.load_kw for r in window])
        temps = np.array([r.temperature for r in window])
        
        rms = np.sqrt(np.mean(loads**2))
        peak = np.max(loads)
        kurtosis_proxy = peak / np.mean(loads) if np.mean(loads) > 0 else 0
        is_workday = 1 if window[-1].is_workday else 0
        
        # Construct Vector
        vector = np.concatenate([loads, temps, [rms, peak, kurtosis_proxy, is_workday]])
        
        # 2. Scale
        vector_scaled = self.scaler.transform([vector])
        
        # 3. Infer
        prediction = self.model.predict(vector_scaled)[0]
        return int(prediction)

#--------------------------------------------------------------------------------------------------------------
# Singleton
ai_brain = TSPipeline()

#--------------------------------------------------------------------------------------------------------------
if __name__ == "__main__":
    from datetime import datetime, timedelta
    from app.core.simulator import grid_sim
    
    print("="*70)
    print("FLUXORAX AI PIPELINE - QUICK TEST")
    print("="*70)
    
    # Test 1: Generate real simulator data and predict
    print("\n[Test 1] Using Real Simulator Data")
    print("-"*70)
    
    history = []
    now = datetime.now()
    
    # Generate 4 readings using the simulator
    for i in range(4):
        ts = now + timedelta(minutes=15*i)
        reading = grid_sim.get_reading(ts)
        history.append(reading)
        print(f"  Reading {i+1}: Load={reading.load_kw:.2f} kW, Temp={reading.temperature:.1f}°C, Risk={reading.risk_label}")
    
    try:
        predicted_risk = ai_brain.predict_risk(history)
        actual_risk = history[-1].risk_label
        
        risk_names = {0: "Normal", 1: "Warning", 2: "Critical"}
        
        print(f"\n  AI Prediction: {predicted_risk} ({risk_names[predicted_risk]})")
        print(f"  Actual Label:  {actual_risk} ({risk_names[actual_risk]})")
        
        if predicted_risk == actual_risk:
            print("  ✓ MATCH!")
        else:
            print("  ✗ MISMATCH (This is expected due to forecasting)")
            
    except Exception as e:
        print(f"  ✗ Error: {e}")
    
    # Test 2: Simulate a critical ramp-up scenario
    print("\n[Test 2] Simulating Critical Ramp-up")
    print("-"*70)
    
    critical_history = []
    base_load = 800.0
    
    for i in range(4):
        ts = now + timedelta(minutes=15*i)
        # Simulate a ramp-up: 800 -> 1000 -> 1200 -> 1500 kW
        load = base_load + (i * 233)
        
        reading = FeederReading(
            timestamp=ts,
            load_kw=load,
            temperature=12.0,
            is_workday=True,
            risk_label=2 if load > 1425 else (1 if load > 1275 else 0)
        )
        critical_history.append(reading)
        print(f"  Reading {i+1}: Load={reading.load_kw:.2f} kW, Risk={reading.risk_label}")
    
    try:
        predicted_risk = ai_brain.predict_risk(critical_history)
        risk_names = {0: "Normal", 1: "Warning", 2: "Critical"}
        
        print(f"\n  AI Prediction: {predicted_risk} ({risk_names[predicted_risk]})")
        print(f"  Expected: Should predict future critical event (Risk 2)")
        
    except Exception as e:
        print(f"  ✗ Error: {e}")
    
    print("\n" + "="*70)
    print("TEST COMPLETE")
    print("="*70)