"""
main.py — SmartShelf AI ML Service
"""

import logging
from contextlib import asynccontextmanager
from typing import Any

import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from preprocess import load_and_preprocess
from train import train, load_model
from forecast import predict_demand

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s — %(message)s")
logger = logging.getLogger(__name__)

app_state: dict[str, Any] = {
    "features": None,
    "dataset_loaded": False,
    "dataset_error": None,
    "model": None,
    "model_meta": None,
    "model_loaded": False,
    "training_in_progress": False,
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting SmartShelf ML service...")
    try:
        df = load_and_preprocess()
        app_state["features"] = df
        app_state["dataset_loaded"] = True
        logger.info("Dataset ready — %d products", len(df))
    except Exception as e:
        app_state["dataset_error"] = str(e)
        logger.warning("Dataset load failed: %s", e)

    model, meta = load_model()
    if model is not None:
        app_state["model"] = model
        app_state["model_meta"] = meta
        app_state["model_loaded"] = True
        logger.info("Pre-trained model loaded")

    yield
    logger.info("Shutting down.")


app = FastAPI(title="SmartShelf AI — ML Service", version="0.2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "dataset_loaded": app_state["dataset_loaded"],
        "dataset_error": app_state["dataset_error"],
        "model_loaded": app_state["model_loaded"],
        "training_in_progress": app_state["training_in_progress"],
    }


@app.post("/train")
def train_model():
    if not app_state["dataset_loaded"]:
        raise HTTPException(status_code=503, detail=app_state["dataset_error"] or "Dataset not loaded")
    if app_state["training_in_progress"]:
        raise HTTPException(status_code=409, detail="Training already in progress")

    app_state["training_in_progress"] = True
    try:
        result = train(app_state["features"])
        model, meta = load_model()
        app_state["model"] = model
        app_state["model_meta"] = meta
        app_state["model_loaded"] = True
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {e}")
    finally:
        app_state["training_in_progress"] = False


@app.get("/model/info")
def model_info():
    if not app_state["model_loaded"]:
        raise HTTPException(status_code=404, detail="No model found. Call POST /train first.")
    return app_state["model_meta"]


class ForecastRequest(BaseModel):
    total_quantity_sold: float = 0
    total_revenue: float = 0
    num_orders: float = 0
    avg_unit_price: float = 0
    avg_quantity_per_order: float = 0
    days_active: float = 0
    month_2011_01: float = 0
    month_2011_02: float = 0
    month_2011_03: float = 0
    month_2011_04: float = 0
    month_2011_05: float = 0
    month_2011_06: float = 0
    month_2011_07: float = 0
    month_2011_08: float = 0
    month_2011_09: float = 0
    month_2011_10: float = 0
    month_2011_11: float = 0
    month_2011_12: float = 0

    def to_feature_dict(self) -> dict:
        return {
            "total_quantity_sold":    self.total_quantity_sold,
            "total_revenue":          self.total_revenue,
            "num_orders":             self.num_orders,
            "avg_unit_price":         self.avg_unit_price,
            "avg_quantity_per_order": self.avg_quantity_per_order,
            "days_active":            self.days_active,
            "month_2011-01": self.month_2011_01,
            "month_2011-02": self.month_2011_02,
            "month_2011-03": self.month_2011_03,
            "month_2011-04": self.month_2011_04,
            "month_2011-05": self.month_2011_05,
            "month_2011-06": self.month_2011_06,
            "month_2011-07": self.month_2011_07,
            "month_2011-08": self.month_2011_08,
            "month_2011-09": self.month_2011_09,
            "month_2011-10": self.month_2011_10,
            "month_2011-11": self.month_2011_11,
            "month_2011-12": self.month_2011_12,
        }


@app.post("/forecast")
def forecast(request: ForecastRequest):
    if not app_state["model_loaded"]:
        raise HTTPException(status_code=404, detail="No model. Call POST /train first.")
    return predict_demand(app_state["model"], app_state["model_meta"], request.to_feature_dict())


@app.get("/dataset/summary")
def dataset_summary():
    if not app_state["dataset_loaded"]:
        raise HTTPException(status_code=503, detail="Dataset not loaded")
    df: pd.DataFrame = app_state["features"]
    return {
        "total_products": len(df),
        "total_features": len(df.columns),
        "top_products_by_revenue": df.nlargest(5, "total_revenue")[
            ["StockCode", "description", "total_quantity_sold", "total_revenue"]
        ].to_dict(orient="records"),
    }