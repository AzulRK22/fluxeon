"""
The AI Brain of the Agent. It Handles Feature Extraction -> Scaling -> Inference.
"""

import joblib
import numpy as np
import os
from app.models import FeederReading

# Paths setup
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, '../../data/models/flux_model.pkl')
SCALER_PATH = os.path.join(BASE_DIR, '../../data/models/scaler.pkl')

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
                print("FLUXORAX AI Model loaded successfully.")
            else:
                print("Model not found. Run 'model_trainer.py' first! Using fallback logic.")
        except Exception as e:
            print(f"Error loading model: {e}")

    def predict_risk(self, history_window: list[FeederReading]) -> int:
        """
        Predicts risk level (0, 1, 2) based on the last 4 readings (1 hour).
        """
        # Fallback if model is missing or insufficient data
        if self.model is None or len(history_window) < 4:
            # Simple rule-based fallback for safety
            last_reading = history_window[-1]
            if last_reading.load_kw > 1425: return 2
            if last_reading.load_kw > 1275: return 1
            return 0

        # 1. Extract Features (Same logic as trainer)
        # We take the last 4 readings
        window = history_window[-4:]
        
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

# Singleton
ai_brain = TSPipeline()