import os
import pandas as pd
import logging

logger = logging.getLogger(__name__)

FORECAST_CSV = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "ml_models", "forecast", "future_forecasts.csv"
)


class HFForecastService:
    """Service to load pre-computed commodity price forecasts from local CSV."""

    _df = None

    @classmethod
    def _load(cls):
        if cls._df is None:
            try:
                cls._df = pd.read_csv(FORECAST_CSV)
                logger.info(f"Loaded forecast CSV with {len(cls._df)} rows")
            except Exception as e:
                logger.error(f"Error loading forecast CSV: {e}")
                cls._df = pd.DataFrame()

    @staticmethod
    def get_commodities() -> list:
        """Return list of available commodities."""
        HFForecastService._load()
        df = HFForecastService._df
        if df is None or df.empty or "commodity" not in df.columns:
            return []
        return sorted(df["commodity"].unique().tolist())

    @staticmethod
    def get_forecast(commodity: str) -> list:
        """
        Return 4-quarter price forecast for a commodity.

        Response shape:
            [
              {"commodity": "Wheat", "year": 2026, "quarter": 3, "price": 2593.67},
              ...
            ]
        """
        HFForecastService._load()
        df = HFForecastService._df
        if df is None or df.empty:
            return []

        mask = df["commodity"].str.lower() == commodity.lower()
        filtered = df[mask]
        if filtered.empty:
            return []

        cols = ["commodity", "year", "quarter", "price"]
        return filtered[cols].to_dict(orient="records")

    @staticmethod
    def get_all_forecasts() -> dict:
        """Return forecast for ALL commodities keyed by commodity name."""
        commodities = HFForecastService.get_commodities()
        results = {}
        for c in commodities:
            results[c] = HFForecastService.get_forecast(c)
        return results
