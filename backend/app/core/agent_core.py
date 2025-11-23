import pandas as pd
import numpy as np
import joblib
import os
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

# Import simulator from the app module (adjust path if running as script)
try:
    from app.core.simulator import grid_sim
except ImportError:
    import sys
    # Add backend directory to path
    sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    from app.core.simulator import grid_sim

# --- CONFIGURATION ---
MODEL_PATH = os.path.join(os.path.dirname(__file__), '../../data/models/flux_model.pkl')
SCALER_PATH = os.path.join(os.path.dirname(__file__), '../../data/models/scaler.pkl')
LAG_WINDOW = 4  # 1 hour history (4 x 15 mins)

def prepare_features(df):
    """
    Phase 1: Fast Feature Extraction.
    Creates a flattened vector from the last 4 intervals.
    """
    X, y = [], []
    
    # We need a rolling window of 'LAG_WINDOW'
    # Features per lag: Load, Temp
    # Global features: Activity
    
    for i in range(LAG_WINDOW, len(df)):
        window = df.iloc[i-LAG_WINDOW : i]
        target = df.iloc[i]['risk_label']
        
        # Feature Vector Construction
  
        loads = window['load_kw'].values       # 1. Lagged Loads
       
        temps = window['temperature'].values  # 2. Lagged Temps

        # 3. Statistical Features (spike if > 100%)
        rms = np.sqrt(np.mean(loads**2))
        peak = np.max(loads)
        kurtosis_proxy = peak / np.mean(loads) if np.mean(loads) > 0 else 0
        
        
        is_workday = 1 if df.iloc[i]['is_workday'] else 0 # 4. Exogenous
        
        vector = np.concatenate([loads, temps, [rms, peak, kurtosis_proxy, is_workday]]) # Combine into a single vector
        # [load_t-4, load_t-3..., temp_t-4..., rms, peak, kurtosis, workday]
        
        X.append(vector)
        y.append(target)
        
    return np.array(X), np.array(y)

def train_agent():
    print("FLUXORAX AI Training. Started.")
    
    df = grid_sim.generate_history(days=60) # 1. Generate Synthetic Data
    print(f"Generated {len(df)} samples.")

    X, y = prepare_features(df)  # 2. Feature Engineering
    print(f"Feature vector shape: {X.shape}")
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)  # 3. Split Data
    
    scaler = StandardScaler()  # 4. Scale Data (Important for Neural Networks)
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    mlp = MLPClassifier(hidden_layer_sizes=(64, 32), max_iter=500, random_state=42)  # 5. Train Dense Neural Network (MLP)
    print("Training Dense Neural Network...") # Hidden layers: 64 neurons, then 32 neurons. ReLU activation.
    mlp.fit(X_train_scaled, y_train)
    
    score = mlp.score(X_test_scaled, y_test)   # 6. Evaluation
    print(f"\nModel Accuracy: {score:.2%}")
    print(classification_report(y_test, mlp.predict(X_test_scaled)))
    
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True) # 7. Save Artifacts
    joblib.dump(mlp, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    print(f"Model saved to: {MODEL_PATH}")

if __name__ == "__main__":
    train_agent()