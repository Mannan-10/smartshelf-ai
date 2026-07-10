"""
main.py
SmartShelf AI — ML Service
FastAPI app with dataset loading on startup and XGBoost training endpoint.
"""

import logging
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

import pandas as pd
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware

from preprocess import load_and_preprocess
from train import train, load_model

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)s  %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

# App state
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

    # Load dataset
    try:
        df = load_and_preprocess()
        app_state["features"] = df
        app_state["dataset_loaded"] = True
        logger.info("Dataset ready — %d products, %d features", len(df), len(df.columns))
    except FileNotFoundError as e:
        app_state["dataset_error"] = str(e)
        logger.warning("Dataset not found: %s", e)
    except Exception as e:
        app_state["dataset_error"] = str(e)
        logger.error("Dataset load failed: %s", e)

    # Load existing model if available
    model, meta = load_model()
    if model is not None:
        app_state["model"] = model
        app_state["model_meta"] = meta
        app_state["model_loaded"] = True
        logger.info("Pre-trained model loaded from disk")

    yield

    logger.info("Shutting down ML service.")


app = FastAPI(
    title="SmartShelf AI — ML Service",
    description="Demand forecasting and reorder suggestions",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    """Health check — always 200 if service is up."""
    return {
        "status": "ok",
        "dataset_loaded": app_state["dataset_loaded"],
        "dataset_error": app_state["dataset_error"],
        "model_loaded": app_state["model_loaded"],
        "training_in_progress": app_state["training_in_progress"],
    }


@app.post("/train")
def train_model():
    """
    Train XGBoost model on the loaded dataset and save to models/model.pkl.
    Returns training metrics on completion.
    """
    if not app_state["dataset_loaded"]:
        raise HTTPException(
            status_code=503,
            detail=app_state["dataset_error"] or "Dataset not loaded. Cannot train.",
        )

    if app_state["training_in_progress"]:
        raise HTTPException(status_code=409, detail="Training already in progress.")

    app_state["training_in_progress"] = True
    try:
        df: pd.DataFrame = app_state["features"]
        result = train(df)

        # Reload model into app state
        model, meta = load_model()
        app_state["model"] = model
        app_state["model_meta"] = meta
        app_state["model_loaded"] = True

        return result
    except Exception as e:
        logger.error("Training failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")
    finally:
        app_state["training_in_progress"] = False


@app.get("/model/info")
def model_info():
    """Returns metadata about the currently loaded model."""
    if not app_state["model_loaded"]:
        raise HTTPException(status_code=404, detail="No trained model found. Call POST /train first.")
    return app_state["model_meta"]


@app.get("/dataset/summary")
def dataset_summary():
    """Basic stats about the loaded dataset."""
    if not app_state["dataset_loaded"]:
        raise HTTPException(status_code=503, detail=app_state["dataset_error"] or "Dataset not loaded")

    df: pd.DataFrame = app_state["features"]
    return {
        "total_products": len(df),
        "total_features": len(df.columns),
        "columns": list(df.columns),
        "top_products_by_revenue": (
            df.nlargest(5, "total_revenue")[
                ["StockCode", "description", "total_quantity_sold", "total_revenue"]
            ].to_dict(orient="records")
        ),
    }


@app.get("/dataset/products")
def list_products(limit: int = 20, offset: int = 0):
    """Paginated product list with engineered features."""
    if not app_state["dataset_loaded"]:
        raise HTTPException(status_code=503, detail="Dataset not loaded")

    df: pd.DataFrame = app_state["features"]
    page = df.iloc[offset: offset + limit]

    return {
        "total": len(df),
        "limit": limit,
        "offset": offset,
        "products": page[[
            "StockCode", "description", "total_quantity_sold",
            "total_revenue", "avg_daily_quantity", "last_sale_date",
        ]].to_dict(orient="records"),
    }