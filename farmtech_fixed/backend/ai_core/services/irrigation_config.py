from typing import Dict, List, Any
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "ml_models" / "irrigation"

# Geolocation / GEE
GEE_PROJECT: str = "ee-yasseralsaed777"
MONTHS: List[int] = list(range(1, 13))

# Crop Growth Months
CROP_GROWTH_MONTHS: Dict[str, List[int]] = {
    "wheat": [11, 12, 1, 2, 3, 4],
    "rice": [5, 6, 7, 8, 9],
    "maize": [6, 7, 8, 9],
    "tomato": [3, 4, 5, 6, 7],
    "potato": [10, 11, 12, 1],
    "mango": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    "sorghum": [6, 7, 8, 9],
    "vegfor": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
}

# Crop-specific irrigation thresholds
IRRIGATION_THRESHOLDS: Dict[str, Dict[str, List[int]]] = {
    "wheat": {"low": [0, 300], "medium": [300, 500], "high": [500, 700]},
    "rice": {"low": [0, 700], "medium": [700, 1100], "high": [1100, 1600]},
    "maize": {"low": [0, 500], "medium": [500, 800], "high": [800, 1100]},
    "potato": {"low": [0, 350], "medium": [350, 600], "high": [600, 850]},
    "tomato": {"low": [0, 400], "medium": [400, 700], "high": [700, 1000]},
    "mango": {"low": [0, 900], "medium": [900, 1300], "high": [1300, 1800]},
    "sorghum": {"low": [0, 350], "medium": [350, 600], "high": [600, 850]},
    "vegfor": {"low": [0, 500], "medium": [500, 900], "high": [900, 1300]}
}
PHYSICAL_IRRIGATION_LIMITS = {
    "wheat": (250, 700),
    "rice": (700, 1800),
    "maize": (450, 1100),
    "potato": (300, 900),
    "tomato": (400, 1000),
    "mango": (900, 1800),
    "sorghum": (250, 750),
    "vegfor": (500, 1300)
}

TEXTURE_ENCODER: Dict[str, int] = {"Clay": 0, "Loam": 1, "Sandy": 2}

def get_season_info(crop_name: str) -> Dict[str, Any]:
    crop_name = crop_name.lower().strip()
    if crop_name in ["wheat", "potato"]:
        season = "winter"
    elif crop_name in ["rice", "maize", "tomato", "sorghum"]:
        season = "summer"
    elif crop_name in ["mango", "vegfor"]:
        season = "perennial"
    else:
        season = "unknown"

    return {
        "season": season,
        "active_months": CROP_GROWTH_MONTHS.get(
            crop_name,
            list(range(1, 13))
        )
    }
