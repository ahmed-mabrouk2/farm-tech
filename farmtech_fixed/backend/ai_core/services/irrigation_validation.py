import numpy as np
import pandas as pd
from typing import Dict, Any
from .irrigation_config import PHYSICAL_IRRIGATION_LIMITS

def validate_prediction(prediction_mm: float, crop_name: str, missing_features: list) -> Dict[str, Any]:
    """
    Validates a prediction against expected physical ranges and checks for missing features.
    Returns a dictionary of diagnostics and flags.
    """
    crop_name = crop_name.lower().strip()
    diagnostics = {
        "status": "OK",
        "warnings": [],
        "uncertainty_flag": False,
        "uncertainty_level": "stable",
        "missing_feature_count": 0,
        "is_physically_realistic": True
    }

    # 1. Missing Features Diagnostic (Median Collapse Prevention)
    missing_count = len(missing_features)

    diagnostics["missing_feature_count"] = missing_count
    if missing_count >= 5:
        diagnostics["warnings"].append(f"High number of missing features ({missing_count}). Extractor fell back to medians extensively, which may cause prediction collapse.")
        diagnostics["status"] = "WARNING"

    # 2. Physical Realism Validation
    if crop_name in PHYSICAL_IRRIGATION_LIMITS:
        min_val, max_val = PHYSICAL_IRRIGATION_LIMITS[crop_name]
        if prediction_mm < (min_val - 50):
            diagnostics["is_physically_realistic"] = False
            diagnostics["status"] = "WARNING"
            diagnostics["warnings"].append(f"Prediction ({prediction_mm:.1f} mm) is below expected physical minimum for {crop_name.capitalize()} ({min_val} mm). Flagging underestimation.")
        elif prediction_mm > (max_val + 50):
            diagnostics["is_physically_realistic"] = False
            diagnostics["status"] = "WARNING"
            diagnostics["warnings"].append(f"Prediction ({prediction_mm:.1f} mm) is above expected physical maximum for {crop_name.capitalize()} ({max_val} mm). Flagging overestimation.")
    if prediction_mm > 1400:
        diagnostics["uncertainty_flag"] = True
        diagnostics["uncertainty_level"] = "high"

    elif prediction_mm > 1000:
        diagnostics["uncertainty_flag"] = True
        diagnostics["uncertainty_level"] = "moderate"
        
    return diagnostics
