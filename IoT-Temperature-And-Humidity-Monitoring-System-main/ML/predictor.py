import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, accuracy_score
from datetime import datetime, timedelta

def load_data(csv_path=None, json_path=None):
    if csv_path:
        df = pd.read_csv(csv_path, header=None, names=['timestamp', 'temperature', 'humidity', 'rain'])
    elif json_path:
        df = pd.read_json(json_path)
    else:
        raise ValueError("Either csv_path or json_path must be provided")
    df['timestamp'] = pd.to_datetime(df['timestamp'], format='%d/%m/%Y %I:%M:%S %p')
    df = df.sort_values('timestamp').reset_index(drop=True)
    return df

def create_lag_features(df, lags=3):
    """
    Create lag features for temperature, humidity, and rain.
    """
    for lag in range(1, lags+1):
        df[f'temperature_lag_{lag}'] = df['temperature'].shift(lag)
        df[f'humidity_lag_{lag}'] = df['humidity'].shift(lag)
        df[f'rain_lag_{lag}'] = df['rain'].shift(lag)
    df = df.dropna().reset_index(drop=True)
    return df

def prepare_features_targets(df):
    """
    Prepare features and targets for multi-output prediction.
    Targets: temperature, humidity, rain at current time
    Features: lagged values of temperature, humidity, rain
    """
    feature_cols = [col for col in df.columns if 'lag' in col]
    X = df[feature_cols]
    y_reg = df[['temperature', 'humidity']]  # regression targets
    y_clf = df['rain']  # classification target
    return X, y_reg, y_clf

def train_models(X_train, y_reg_train, y_clf_train):
    reg_model = RandomForestRegressor(n_estimators=100, random_state=42)
    clf_model = RandomForestClassifier(n_estimators=100, random_state=42)

    reg_model.fit(X_train, y_reg_train)
    clf_model.fit(X_train, y_clf_train)

    return reg_model, clf_model

def evaluate_models(reg_model, clf_model, X_test, y_reg_test, y_clf_test):
    y_reg_pred = reg_model.predict(X_test)
    y_clf_pred = clf_model.predict(X_test)

    mse_temp = mean_squared_error(y_reg_test['temperature'], y_reg_pred[:, 0])
    mse_hum = mean_squared_error(y_reg_test['humidity'], y_reg_pred[:, 1])
    acc_rain = accuracy_score(y_clf_test, y_clf_pred)

    print(f"Temperature MSE: {mse_temp:.4f}")
    print(f"Humidity MSE: {mse_hum:.4f}")
    print(f"Rain Accuracy: {acc_rain:.4f}")

def predict_future(reg_model, clf_model, recent_data, steps=1):
    """
    Predict future temperature, humidity, and rain for given steps.
    recent_data: DataFrame with columns ['temperature', 'humidity', 'rain'] for last lags rows
    """
    lags = recent_data.shape[0]
    predictions = []

    data = recent_data.copy()

    for _ in range(steps):
        # Create feature vector from last lags
        features = []
        for lag in range(1, lags+1):
            features.append(data.iloc[-lag]['temperature'])
        for lag in range(1, lags+1):
            features.append(data.iloc[-lag]['humidity'])
        for lag in range(1, lags+1):
            features.append(data.iloc[-lag]['rain'])
        features = np.array(features).reshape(1, -1)

        # Predict
        reg_pred = reg_model.predict(features)[0]
        clf_pred = clf_model.predict(features)[0]

        # Append prediction
        pred_dict = {
            'temperature': reg_pred[0],
            'humidity': reg_pred[1],
            'rain': clf_pred
        }
        predictions.append(pred_dict)

        # Append prediction to data for next step prediction
        new_row = pd.DataFrame([pred_dict])
        data = pd.concat([data, new_row], ignore_index=True)

    return predictions

import json

if __name__ == "__main__":
    # Example usage
    csv_path = "../server/Sensor Data/sensorData.csv"
    df = load_data(csv_path=csv_path)
    df = create_lag_features(df, lags=3)
    X, y_reg, y_clf = prepare_features_targets(df)

    X_train, X_test, y_reg_train, y_reg_test, y_clf_train, y_clf_test = train_test_split(
        X, y_reg, y_clf, test_size=0.2, random_state=42)

    reg_model, clf_model = train_models(X_train, y_reg_train, y_clf_train)
    evaluate_models(reg_model, clf_model, X_test, y_reg_test, y_clf_test)

    # Predict next 5 steps based on last 3 rows of original data
    recent_data = df[['temperature', 'humidity', 'rain']].tail(3)
    future_preds = predict_future(reg_model, clf_model, recent_data, steps=5)

    # Convert numpy types to native Python types for JSON serialization
    def convert_types(preds):
        converted = []
        for p in preds:
            converted.append({
                'temperature': float(p['temperature']),
                'humidity': float(p['humidity']),
                'rain': int(p['rain'])
            })
        return converted

    clean_preds = convert_types(future_preds)
    print(json.dumps(clean_preds))
