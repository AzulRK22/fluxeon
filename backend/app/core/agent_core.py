import pandas as pd
import numpy as np
import joblib
import os
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from sklearn.utils import resample

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
        # TARGET: Forecasting (predicting the FUTURE risk)
        # The simulator now generates RAMP-UP peaks, so the past window contains precursors.
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
    
    # 1. Generate Synthetic Data
    df = grid_sim.generate_history(days=60)
    print(f"Generated {len(df)} samples.")

    # 2. Feature Engineering
    X, y = prepare_features(df)
    
    # --- CLASS BALANCING (Oversampling) ---
    # Convert to DataFrame for easier manipulation
    df_train = pd.DataFrame(X)
    df_train['target'] = y
    
    # Separate classes
    df_normal = df_train[df_train.target == 0]
    df_warning = df_train[df_train.target == 1]
    df_critical = df_train[df_train.target == 2]
    
    # Upsample minority classes
    df_warning_upsampled = resample(df_warning, 
                                    replace=True,     # sample with replacement
                                    n_samples=len(df_normal),    # to match majority class
                                    random_state=42) 
                                    
    df_critical_upsampled = resample(df_critical, 
                                     replace=True,     # sample with replacement
                                     n_samples=len(df_normal),    # to match majority class
                                     random_state=42)
                                     
    # Combine results
    df_upsampled = pd.concat([df_normal, df_warning_upsampled, df_critical_upsampled])
    
    # Split back into X and y
    X_balanced = df_upsampled.drop('target', axis=1).values
    y_balanced = df_upsampled.target.values
    
    # 3. Split Data
    X_train, X_test, y_train, y_test = train_test_split(X_balanced, y_balanced, test_size=0.2, random_state=42)
    
    # 4. Scale Data
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # 5. Train Neural Network
    print("Training Dense Neural Network...") 
    mlp = MLPClassifier(hidden_layer_sizes=(64, 32), max_iter=1000, random_state=42)
    mlp.fit(X_train_scaled, y_train)
    
    # 6. Evaluation
    score = mlp.score(X_test_scaled, y_test)
    print(f"Model Accuracy: {score:.2%}")
    print(classification_report(y_test, mlp.predict(X_test_scaled), 
                                labels=[0, 1, 2],
                                target_names=['Normal', 'Warning', 'Critical'],
                                zero_division=0))
    
    # 7. Save Artifacts
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(mlp, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    print(f"Model saved to: {MODEL_PATH}")

if __name__ == "__main__":
    train_agent()
