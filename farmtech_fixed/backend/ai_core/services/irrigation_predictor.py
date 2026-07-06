import pickle
import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple
from .irrigation_config import MODELS_DIR, TEXTURE_ENCODER, IRRIGATION_THRESHOLDS
from .irrigation_config import PHYSICAL_IRRIGATION_LIMITS

def _load_pkl(path):
    if not path.exists():
        raise FileNotFoundError(f"Model file not found: {path}")
    with open(path, "rb") as f:
        return pickle.load(f)


# Load artifacts upon module import to cache them
model = _load_pkl(MODELS_DIR / "irrigation_lgbm_seasonal.pkl")
feature_names = _load_pkl(MODELS_DIR / "feature_names.pkl")
train_medians = _load_pkl(MODELS_DIR / "train_medians.pkl")

if not isinstance(feature_names, list):
    raise TypeError(
        "feature_names.pkl must contain list"
    )

if len(feature_names) < 10:
    raise ValueError(
        "feature schema corrupted"
    )
    
# Load fold models for uncertainty estimation
fold_models = []
fold_dir = MODELS_DIR / "fold_models"

if fold_dir.exists():
    for p in sorted(fold_dir.glob("fold_*.pkl")):
        fold_models.append(
            _load_pkl(p)
        )
        
VALID_CROPS = [
    "maize",
    "rice",
    "wheat",
    "tomato",
    "potato",
    "mango",
    "sorghum",
    "vegfor"
]

def classify_irrigation(value: float, crop_name: str) -> str:
    thresholds = IRRIGATION_THRESHOLDS.get(crop_name.lower())
    if not thresholds:
        # Default fallback
        if value < 400:
            return "Low"
        elif value < 800:
            return "Medium"
        return "High"
        
    if value < thresholds["low"][1]:
        return "Low"
    elif value < thresholds["medium"][1]:
        return "Medium"
    return "High"

TREE_NAN_FEATURES = {
    "s_rice_sar_signal",
    "s_maize_sar_signal",
    "s_wheat_sar_signal",
    "s_summer_ndre_peak",
    "s_winter_ndre_peak",
    "rice_flooding_signal",
    "s_sar_vv_mean",
    "s_sar_vh_mean",
    "s_sar_vv_vh_ratio"
}

def prepare_features(engineered: Dict[str, Any], crop_val: str) -> Tuple[pd.DataFrame, list, dict]:
    """
    Encodes categorical features, fills missing values with training medians,
    and strictly orders features to match the model training schema.
    """
    valid_lower = {c.lower(): c for c in VALID_CROPS}
    crop_key = crop_val.lower().strip()
    
    if crop_key not in valid_lower:
        raise ValueError(
            f"Invalid crop type: {crop_val}"
        )
    
    # Native deterministic encoding fallback (avoids relying purely on unpickled classes_)
    hardcoded_classes = sorted([c.lower().strip() for c in VALID_CROPS])
    crop_to_idx = {c: i for i, c in enumerate(hardcoded_classes)}
    engineered["crop_encoded"] = crop_to_idx[crop_key]
    
    tex_class = engineered.get("soil_texture_class", "Loam")
    engineered["texture_encoded"] = TEXTURE_ENCODER.get(tex_class, 1)

    df = pd.DataFrame([engineered])
    missing_features = []
    filled_with_medians = {}
    
    global_feature_medians = {}

    for crop_name in train_medians:
        for feat, val in train_medians[crop_name].items():
            if pd.notna(val):
                global_feature_medians.setdefault(feat, []).append(val)

    global_feature_medians = {
        k: float(np.mean(v))
        for k, v in global_feature_medians.items()
    }
    
    def get_median(col):
        # Match case-insensitively since train_medians keys might be capitalized
        matched_crop_key = next((k for k in train_medians.keys() if k.lower().strip() == crop_key), None)
        
        if matched_crop_key and col in train_medians[matched_crop_key] and pd.notna(train_medians[matched_crop_key][col]):
            return train_medians[matched_crop_key][col]
        vals = [train_medians[c].get(col) for c in train_medians if pd.notna(train_medians[c].get(col))]
        if vals:
            return float(np.mean(vals))

        if col in global_feature_medians:
            return global_feature_medians[col]

        raise ValueError(
            f"No median available for feature: {col}"
        )
        
    for col in feature_names:
        if col not in df.columns or (df[col].dtype == "object" and col not in ["soil_texture_class"]):
            missing_features.append(col)
            val = get_median(col)
            df[col] = val
            filled_with_medians[col] = val
        elif pd.isna(df[col].iloc[0]):
            missing_features.append(col)
            # Base features get filled with medians, crop-specific features are left as NaN for tree splits
            if col not in TREE_NAN_FEATURES:
                val = get_median(col)
                df[col] = val
                filled_with_medians[col] = val
            else:
                df[col] = np.nan

    # Restrict to training features and exact order
    df = df[feature_names]
    
    return df, missing_features, filled_with_medians

def predict(df: pd.DataFrame, crop_name: str, missing_count: int = 0) -> Tuple[float, float, str, str]:
    """Runs LightGBM inference and computes uncertainty."""
    pred_main = float(model.predict(df)[0])
    if fold_models:
        preds = [float(fm.predict(df)[0]) for fm in fold_models]
        uncertainty = float(np.std(preds))
    else:
        uncertainty = 0.0

    # 1. SAR-Sensitive Crop Penalties & Adaptive Uncertainty Inflation
    # Detect if critical structural sensors are missing
    sar_missing = pd.isna(df.get("s_sar_vv_mean", pd.Series([0])).iloc[0]) or pd.isna(df.get("s_sar_vh_mean", pd.Series([0])).iloc[0])
    
    if sar_missing:
        uncertainty *= 1.6  # Inflate uncertainty to strictly reflect structural blindness
        if crop_name in ["tomato", "potato", "wheat"]:
            # Hard penalize biological predictions to safe, conservative baselines when structurally blind
            pred_main *= 0.85

    # 2. Adaptive Uncertainty-Aware Bounding & Crop-Specific Damping
    if crop_name in PHYSICAL_IRRIGATION_LIMITS:
        low, high = PHYSICAL_IRRIGATION_LIMITS[crop_name]
        
        # Shrink the acceptable maximum physical bound if the tree ensemble is highly uncertain (OOD regimes)
        effective_high = high - (uncertainty * 0.4) if uncertainty > 40 else high
        
        # Crop-specific damping slopes (sensitive crops get heavily clamped against spikes)
        damping_factor = 4.0 if crop_name in ["tomato", "potato", "wheat"] else 12.0
        
        # Apply strict logarithmic compression beyond the adaptive limits
        if pred_main > effective_high:
            excess = pred_main - effective_high
            pred_main = float(effective_high + np.log1p(excess) * damping_factor)
        elif pred_main < low:
            deficit = low - pred_main
            pred_main = float(low - np.log1p(deficit) * damping_factor)

    # 3. Confidence Downgrading Under Critical Feature Loss
    if uncertainty < 30.0 and missing_count <= 1 and not sar_missing:
        confidence = "high"
        reliability = "stable"
    elif uncertainty < 50.0 and missing_count <= 2 and not sar_missing:
        confidence = "medium"
        reliability = "moderate"
    else:
        confidence = "low"
        reliability = "uncertain"
        
    return pred_main, uncertainty, confidence, reliability
