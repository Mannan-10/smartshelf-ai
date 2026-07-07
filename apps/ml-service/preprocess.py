"""
preprocess.py
Load and clean the Online Retail dataset, then engineer features
for demand forecasting and reorder suggestions.

Dataset: UCI Online Retail (OnlineRetail.xlsx or OnlineRetail.csv)
Source: https://archive.ics.uci.edu/dataset/352/online+retail
Place the file at: ml-service/data/OnlineRetail.xlsx
"""

import os
import logging
import pandas as pd
import numpy as np
from pathlib import Path

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).parent / "data"
DATASET_XLSX = DATA_DIR / "OnlineRetail.xlsx"
DATASET_CSV  = DATA_DIR / "OnlineRetail.csv"


def load_raw() -> pd.DataFrame:
    """Load the raw Online Retail dataset from disk."""
    if DATASET_XLSX.exists():
        logger.info("Loading dataset from %s", DATASET_XLSX)
        df = pd.read_excel(DATASET_XLSX, engine="openpyxl")
    elif DATASET_CSV.exists():
        logger.info("Loading dataset from %s", DATASET_CSV)
        df = pd.read_csv(DATASET_CSV, encoding="ISO-8859-1")
    else:
        raise FileNotFoundError(
            f"Online Retail dataset not found. "
            f"Place OnlineRetail.xlsx or OnlineRetail.csv in {DATA_DIR}"
        )
    logger.info("Loaded %d rows", len(df))
    return df


def clean(df: pd.DataFrame) -> pd.DataFrame:
    """Remove cancellations, nulls, and bad rows."""
    # Drop rows with missing CustomerID or Description
    df = df.dropna(subset=["CustomerID", "Description"])

    # Remove cancellations (InvoiceNo starts with 'C')
    df = df[~df["InvoiceNo"].astype(str).str.startswith("C")]

    # Remove rows with non-positive Quantity or UnitPrice
    df = df[df["Quantity"] > 0]
    df = df[df["UnitPrice"] > 0]

    # Parse InvoiceDate
    df["InvoiceDate"] = pd.to_datetime(df["InvoiceDate"])

    # Add revenue column
    df["Revenue"] = df["Quantity"] * df["UnitPrice"]

    logger.info("After cleaning: %d rows", len(df))
    return df.reset_index(drop=True)


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Build product-level features useful for demand forecasting:
    - total_quantity_sold
    - total_revenue
    - num_orders          (distinct invoices this product appeared in)
    - avg_quantity_per_order
    - avg_unit_price
    - days_active         (span between first and last sale)
    - avg_daily_quantity  (total_quantity / days_active)
    - last_sale_date
    - month_*             (monthly quantity sold — last 12 months as columns)
    """
    reference_date = df["InvoiceDate"].max()

    # ── Base product-level aggregations ──────────────────────────────────────
    base = (
        df.groupby("StockCode")
        .agg(
            description=("Description", "first"),
            total_quantity_sold=("Quantity", "sum"),
            total_revenue=("Revenue", "sum"),
            num_orders=("InvoiceNo", "nunique"),
            avg_unit_price=("UnitPrice", "mean"),
            first_sale_date=("InvoiceDate", "min"),
            last_sale_date=("InvoiceDate", "max"),
        )
        .reset_index()
    )

    base["avg_quantity_per_order"] = (
        base["total_quantity_sold"] / base["num_orders"]
    ).round(2)

    base["days_active"] = (
        (base["last_sale_date"] - base["first_sale_date"]).dt.days + 1
    )

    base["avg_daily_quantity"] = (
        base["total_quantity_sold"] / base["days_active"]
    ).round(4)

    # ── Monthly quantity pivot (last 12 months) ───────────────────────────────
    df["year_month"] = df["InvoiceDate"].dt.to_period("M")
    last_12 = df["year_month"].unique()
    last_12 = sorted(last_12)[-12:]

    monthly = (
        df[df["year_month"].isin(last_12)]
        .groupby(["StockCode", "year_month"])["Quantity"]
        .sum()
        .unstack(fill_value=0)
    )
    monthly.columns = [f"month_{str(c)}" for c in monthly.columns]
    monthly = monthly.reset_index()

    features = base.merge(monthly, on="StockCode", how="left")

    # Fill missing monthly columns with 0
    month_cols = [c for c in features.columns if c.startswith("month_")]
    features[month_cols] = features[month_cols].fillna(0)

    logger.info("Feature table: %d products, %d features", len(features), len(features.columns))
    return features


def load_and_preprocess() -> pd.DataFrame:
    """Full pipeline: load → clean → engineer features."""
    raw = load_raw()
    cleaned = clean(raw)
    features = engineer_features(cleaned)
    return features


# ── Quick sanity check when run directly ─────────────────────────────────────
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    df = load_and_preprocess()
    print(df.head())
    print(df.dtypes)
    print(f"\nShape: {df.shape}")