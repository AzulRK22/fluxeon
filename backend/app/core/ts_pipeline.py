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

    def load_model(self): #Loads the pre-trained artifacts.
        try:
            if os.path.exists(MODEL_PATH):
                self.model = joblib.load(MODEL_PATH)
                self.scaler = joblib.load(SCALER_PATH)
                print("FLUXORAX AI Model loaded successfully.")
            else:
                print(f"CRITICAL ERROR: Model not found at {MODEL_PATH}")
                print("Please run 'python -m app.core.agent_core' to train the model first.")
                self.model = None
        except Exception as e:
            print(f"Error loading model: {e}")
            self.model = None
#--------------------------------------------------------------------------------------------------------------
    def predict_risk(self, history_window: list[FeederReading]) -> int:

        if self.model is None: # Check if model is loaded
            raise RuntimeError("AI Model is not loaded. Cannot make predictions. Train the model first.")

        if len(history_window) < 4: # Check for sufficient data
            print("Insufficient data for prediction (need 4 readings). Returning 0 (Normal).")
            return 0

        # 1. Extract Features (Same logic as trainer)
        
        window = history_window[-4:] # We take the last 4 readings
        
        loads = np.array([r.load_kw for r in window])
        temps = np.array([r.temperature for r in window])
        
        rms = np.sqrt(np.mean(loads**2))
        peak = np.max(loads)
        kurtosis_proxy = peak / np.mean(loads) if np.mean(loads) > 0 else 0
        is_workday = 1 if window[-1].is_workday else 0
        
        # Construct Vector
        vector = np.concatenate([loads, temps, [rms, peak, kurtosis_proxy, is_workday]])
        
        # 2. Scale
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

    def load_model(self): #Loads the pre-trained artifacts.
        try:
            if os.path.exists(MODEL_PATH):
                self.model = joblib.load(MODEL_PATH)
                self.scaler = joblib.load(SCALER_PATH)
                print("FLUXORAX AI Model loaded successfully.")
            else:
                print(f"CRITICAL ERROR: Model not found at {MODEL_PATH}")
                print("Please run 'python -m app.core.agent_core' to train the model first.")
                self.model = None
        except Exception as e:
            print(f"Error loading model: {e}")
            self.model = None
#--------------------------------------------------------------------------------------------------------------
    def predict_risk(self, history_window: list[FeederReading]) -> int:

        if self.model is None: # Check if model is loaded
            raise RuntimeError("AI Model is not loaded. Cannot make predictions. Train the model first.")

        if len(history_window) < 4: # Check for sufficient data
            print("Insufficient data for prediction (need 4 readings). Returning 0 (Normal).")
            return 0

        # 1. Extract Features (Same logic as trainer)
        
        window = history_window[-4:] # We take the last 4 readings
        
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

if __name__ == "__main__":
    from datetime import datetime, timedelta
    print("--- Pipeline Test ---")
    
    # Create dummy readings
    now = datetime.now()
    
    # 1. Test Normal Case
    print("\nTesting Normal Flow (Load ~500kW):")
    readings_normal = []
    for i in range(4):
        r = FeederReading(
            timestamp=now + timedelta(minutes=15*i),
            load_kw=500.0 + i*10, 
            temperature=15.0,
            is_workday=True,
            risk_label=0
        )
        readings_normal.append(r)
    
    try:
        risk = ai_brain.predict_risk(readings_normal)
        print(f"Predicted Risk: {risk} (Expected: 0)")
    except Exception as e:
        print(f"Error: {e}")

    # 2. Test Critical Case
    print("\nTesting Critical Flow (Load ~1600kW):")
    readings_critical = []
    for i in range(4):
        r = FeederReading(
            timestamp=now + timedelta(minutes=15*i),
            load_kw=1600.0, 
            temperature=10.0,
            is_workday=True,
            risk_label=2
        )
        readings_critical.append(r)
        
    try:
        risk = ai_brain.predict_risk(readings_critical)
        print(f"Predicted Risk: {risk} (Expected: 2)")
    except Exception as e:
        print(f"Error: {e}")