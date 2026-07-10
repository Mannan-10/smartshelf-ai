"""
train.py
Train an XGBoost regressor to predict avg_daily_quantity (demand proxy).
Features: product-level aggregations + monthly sales columns.
Saves the trained model and feature list to disk with joblib.
"""

import logging
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
from xgboost import XGBRegressor

logger = logging.getLogger(__name__)

MODEL_DIR  = Path(__file__).parent / "models"
MODEL_PATH = MODEL_DIR / "model.pkl"
META_PATH  = MODEL_DIR / "model_meta.pkl"

NUMERIC_FEATURES = [
    "total_quantity_sold",
    "total_revenue",
    "num_orders",
    "avg_unit_price",
    "avg_quantity_per_order",
    "days_active",
]

TARGET = "avg_daily_quantity"


def get_month_cols(df: pd.DataFrame) -> list:
    return sorted([c for c in df.columns if c.startswith("month_")])


def prepare_X_y(df: pd.DataFrame):
    month_cols = get_month_cols(df)
    feature_cols = NUMERIC_FEATURES + month_cols

    # Only train on products that have actual sales history
    df_clean = df[df[TARGET] > 0].copy()

    X = df_clean[feature_cols].fillna(0).astype(float)
    y = df_clean[TARGET].astype(float)

    return X, y, feature_cols


def train(df: pd.DataFrame) -> dict:
    """Train XGBoost regressor and save model + metadata. Returns training metrics."""
    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    logger.info("Preparing features...")
    X, y, feature_cols = prepare_X_y(df)
    logger.info("Training set: %d samples, %d features", len(X), len(feature_cols))

    # Log-transform target — demand is heavily right-skewed
    y_log = np.log1p(y)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_log, test_size=0.2, random_state=42
    )

    model = XGBRegressor(
        n_estimators=200,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        objective="reg:squarederror",
        random_state=42,
        n_jobs=-1,
    )

    logger.info("Training XGBoost model...")
    model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=False)

    # Evaluate — inverse log-transform for interpretable units
    y_pred = np.expm1(model.predict(X_test))
    y_true = np.expm1(y_test)

    mae = float(mean_absolute_error(y_true, y_pred))
    r2  = float(r2_score(y_true, y_pred))
    logger.info("MAE: %.4f  R2: %.4f", mae, r2)

    # Feature importances
    importances = dict(zip(feature_cols, model.feature_importances_.tolist()))
    top5 = sorted(importances.items(), key=lambda x: x[1], reverse=True)[:5]

    # Save model and metadata
    joblib.dump(model, MODEL_PATH)
    meta = {
        "feature_cols": feature_cols,
        "target": TARGET,
        "metrics": {"mae": mae, "r2": r2},
        "top_features": top5,
        "n_samples_train": len(X_train),
        "n_samples_test": len(X_test),
    }
    joblib.dump(meta, META_PATH)
    logger.info("Model saved to %s", MODEL_PATH)

    return {
        "status": "trained",
        "n_samples": len(X),
        "n_features": len(feature_cols),
        "metrics": {"mae": round(mae, 4), "r2": round(r2, 4)},
        "top_features": top5,
        "model_path": str(MODEL_PATH),
    }


def load_model():
    """Load saved model and metadata. Returns (model, meta) or (None, None)."""
    if not MODEL_PATH.exists() or not META_PATH.exists():
        return None, None
    return joblib.load(MODEL_PATH), joblib.load(META_PATH)


if __name__ == "__main__":
    import sys
    logging.basicConfig(level=logging.INFO)
    sys.path.insert(0, str(Path(__file__).parent))
    from preprocess import load_and_preprocess
    df = load_and_preprocess()
    result = train(df)
    print(result)