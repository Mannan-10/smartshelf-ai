"""
forecast.py
Given a product feature vector, predict demand for the next 7 days.
"""

import logging
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


def predict_demand(model, meta: dict, product_features: dict) -> dict:
    feature_cols = meta["feature_cols"]

    row = {col: product_features.get(col, 0) for col in feature_cols}
    X = pd.DataFrame([row])[feature_cols].astype(float)

    y_log = model.predict(X)[0]
    avg_daily_qty = float(np.expm1(y_log))
    avg_daily_qty = max(0.0, avg_daily_qty)

    daily_forecast = [round(avg_daily_qty, 2)] * 7

    return {
        "avg_daily_quantity": round(avg_daily_qty, 2),
        "forecast_7_days": daily_forecast,
        "forecast_total_7_days": round(avg_daily_qty * 7, 2),
    }