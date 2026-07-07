"""
main.py
SmartShelf AI — ML Service
FastAPI app. Loads and preprocesses the Online Retail dataset on startup,
then exposes endpoints for demand forecasting (future tasks).
"""

import logging
from contextlib import asynccontextmanager
from typing import Any

import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from preprocess import load_and_preprocess

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)s  %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

# ── App state: holds the preprocessed feature dataframe ──────────────────────
app_state: dict[str, Any] = {
    "features": None,
    "dataset_loaded": False,
    "dataset_error": None,
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load dataset on startup, clean up on shutdown."""
    logger.info("Starting SmartShelf ML service...")
    try:
        df = load_and_preprocess()
        app_state["features"] = df
        app_state["dataset_loaded"] = True
        logger.info(
            "Dataset ready — %d products, %d features", len(df), len(df.columns)
        )
    except FileNotFoundError as e:
        app_state["dataset_error"] = str(e)
        logger.warning("Dataset not found — service running without preloaded data. %s", e)
    except Exception as e:
        app_state["dataset_error"] = str(e)
        logger.error("Dataset load failed: %s", e)

    yield  # app is running

    logger.info("Shutting down ML service.")
    app_state["features"] = None


# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="SmartShelf AI — ML Service",
    description="Demand forecasting and reorder suggestions for SmartShelf AI",
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
    """Health check — always returns 200 if the service is up."""
    return {
        "status": "ok",
        "dataset_loaded": app_state["dataset_loaded"],
        "dataset_error": app_state["dataset_error"],
    }


@app.get("/dataset/summary")
def dataset_summary():
    """Returns basic stats about the loaded dataset."""
    if not app_state["dataset_loaded"]:
        raise HTTPException(
            status_code=503,
            detail=app_state["dataset_error"] or "Dataset not loaded",
        )

    df: pd.DataFrame = app_state["features"]

    return {
        "total_products": len(df),
        "total_features": len(df.columns),
        "columns": list(df.columns),
        "top_products_by_revenue": (
            df.nlargest(5, "total_revenue")[
                ["StockCode", "description", "total_quantity_sold", "total_revenue"]
            ]
            .to_dict(orient="records")
        ),
    }


@app.get("/dataset/products")
def list_products(limit: int = 20, offset: int = 0):
    """Paginated list of products with their engineered features."""
    if not app_state["dataset_loaded"]:
        raise HTTPException(status_code=503, detail="Dataset not loaded")

    df: pd.DataFrame = app_state["features"]
    page = df.iloc[offset : offset + limit]

    return {
        "total": len(df),
        "limit": limit,
        "offset": offset,
        "products": page[
            [
                "StockCode",
                "description",
                "total_quantity_sold",
                "total_revenue",
                "avg_daily_quantity",
                "last_sale_date",
            ]
        ].to_dict(orient="records"),
    }