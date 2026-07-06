import json
import os
import numpy as np

class SeasonMapper:
    """
    Extracts seasonal satellite features based on crop-specific growing calendars.
    Replaces annual averages with targeted seasonal aggregation.
    """
    def __init__(self, config_dir: str):
        calendar_path = os.path.join(config_dir, "crop_calendar.json")
        with open(calendar_path, "r") as f:
            self.crop_calendar = json.load(f)

    def compute_seasonal_features(self, field_data: dict) -> dict:
        """
        Takes a dictionary with monthly NDRE, NDVI, EVI and computes seasonal features (Advanced Mode).
        If 'season_ndre_mean' is already present, assumes Basic Mode and skips computation.
        """
        # Basic mode check
        if 'season_ndre_mean' in field_data and 'season_ndvi_mean' in field_data and 'season_evi_mean' in field_data:
            return field_data

        crop = str(field_data.get('crop', '')).lower()
        if crop not in self.crop_calendar:
            raise ValueError(f"Crop '{crop}' not found in crop calendar.")

        season_months = self.crop_calendar[crop]["months"]
        
        # Ensure all required keys exist
        for prefix in ["ndre", "ndvi", "evi"]:
            for m in season_months:
                key = f"{prefix}_m{m:02d}"
                if key not in field_data:
                    raise ValueError(f"Required temporal feature '{key}' is missing for crop '{crop}' in Advanced mode.")

        # Extract season values
        ndre_vals = [float(field_data[f"ndre_m{m:02d}"]) for m in season_months]
        ndvi_vals = [float(field_data[f"ndvi_m{m:02d}"]) for m in season_months]
        evi_vals = [float(field_data[f"evi_m{m:02d}"]) for m in season_months]

        # Aggregate
        field_data["season_ndre_mean"] = np.mean(ndre_vals)
        field_data["season_ndre_peak"] = np.max(ndre_vals)
        
        field_data["season_ndvi_mean"] = np.mean(ndvi_vals)
        field_data["season_ndvi_peak"] = np.max(ndvi_vals)

        field_data["season_evi_mean"] = np.mean(evi_vals)
        field_data["season_evi_peak"] = np.max(evi_vals)

        return field_data
