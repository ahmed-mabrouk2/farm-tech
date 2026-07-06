import numpy as np
import pandas as pd
from typing import Dict, Any, List, cast


def _seasonal_agg(row: Dict, prefix: str, months: List[int], agg: str = "mean", smooth: bool = False):
    """Aggregate monthly values over active months."""
    vals = [row.get(f"{prefix}_m{m:02d}") for m in months]
    
    if smooth and len(months) == 12:
        s = pd.Series(vals, dtype=float)
        vals = s.rolling(window=5, center=True, min_periods=1).mean().tolist()
        
    vals = [v for v in vals if pd.notna(v)]
    if not vals:
        return np.nan
    if agg == "mean":
        return sum(vals) / len(vals)
    if agg == "sum":
        return sum(vals)
    if agg == "max":
        return max(vals)
    if agg == "min":
        return min(vals)
    return np.nan


def compute_seasonal_features(row: Dict[str, Any], active_months: List[int],
                              season: str = "perennial") -> Dict[str, Any]:
    """
    Computes all seasonal features for a single row.
    This function is called both during training and inference.
    """
    months = active_months
    n = len(months)
    crop_name = season  # We set season to crop_name in get_season_info

    # --- Seasonal optical indices ---
    is_perennial = crop_name in ["mango", "vegfor"]
    for prefix in ["ndvi", "evi", "lswi", "ndre", "savi", "ndwi"]:
        row[f"s_{prefix}_mean"] = _seasonal_agg(row, prefix, months, "mean", smooth=is_perennial)
        row[f"s_{prefix}_max"]  = _seasonal_agg(row, prefix, months, "max", smooth=is_perennial)

    ndvi_max = _seasonal_agg(row, "ndvi", months, "max", smooth=is_perennial)
    ndvi_min = _seasonal_agg(row, "ndvi", months, "min", smooth=is_perennial)
    row["s_ndvi_amplitude"] = (ndvi_max - ndvi_min) if pd.notna(ndvi_max) and pd.notna(ndvi_min) else np.nan

    # --- Seasonal climate ---
    row["s_temp_mean"]  = _seasonal_agg(row, "temp", months, "mean")
    row["s_precip_sum"] = _seasonal_agg(row, "pr",   months, "sum")
    
    vpd_raw = _seasonal_agg(row, "vpd",  months, "mean")
    row["s_vpd_mean"]   = (vpd_raw / 10.0) if pd.notna(vpd_raw) else np.nan

    # --- Seasonal SAR (with temporal interpolation) ---
    for pol in ["vv", "vh"]:
        sar_vals = pd.Series([row.get(f"sar_{pol}_m{m:02d}") for m in range(1, 13)], dtype=float)
        sar_vals = sar_vals.interpolate(method="linear", limit_direction="both")
        for i, m in enumerate(range(1, 13)):
            row[f"sar_{pol}_m{m:02d}"] = sar_vals.iloc[i] if pd.notna(sar_vals.iloc[i]) else np.nan

    row["s_sar_vv_mean"] = _seasonal_agg(row, "sar_vv", months, "mean")
    row["s_sar_vh_mean"] = _seasonal_agg(row, "sar_vh", months, "mean")
    vh = row.get("s_sar_vh_mean")
    vv = row.get("s_sar_vv_mean")
    row["s_sar_vv_vh_ratio"] = vv / (vh + 1e-6) if pd.notna(vv) and pd.notna(vh) else np.nan

    # --- Crop-specific SAR signals ---
    if crop_name == "rice":
        rice_vv = _seasonal_agg(row, "sar_vv", [6, 7], "min")
        row["s_rice_sar_signal"] = rice_vv if pd.notna(rice_vv) else np.nan
    elif crop_name == "maize":
        row["s_maize_sar_signal"] = _seasonal_agg(row, "sar_vh", [7, 8, 9], "mean")
    elif crop_name == "wheat":
        w_vv = _seasonal_agg(row, "sar_vv", [1, 2, 3, 4], "mean")
        w_vh = _seasonal_agg(row, "sar_vh", [1, 2, 3, 4], "mean")
        row["s_wheat_sar_signal"] = w_vv / (w_vh + 1e-6) if pd.notna(w_vv) and pd.notna(w_vh) else np.nan

    for k in ["s_rice_sar_signal", "s_maize_sar_signal", "s_wheat_sar_signal"]:
        row.setdefault(k, 0.0)

    # --- Seasonal NDRE peaks ---
    is_summer_crop = any(m in months for m in [6, 7, 8])
    is_winter_crop = any(m in months for m in [1, 2, 3])
    
    if is_summer_crop:
        row["s_summer_ndre_peak"] = _seasonal_agg(row, "ndre", [7, 8, 9], "max")
    else:
        row["s_summer_ndre_peak"] = 0.0
        
    if is_winter_crop:
        row["s_winter_ndre_peak"] = _seasonal_agg(row, "ndre", [2, 3, 4], "max")
    else:
        row["s_winter_ndre_peak"] = 0.0

    # --- Seasonal PET (Improved Arid ET Approximation) ---
    t_season = row.get("s_temp_mean")
    vpd_season = row.get("s_vpd_mean")
    srad = row.get("srad_mean")

    if all(pd.notna(v) for v in [t_season, vpd_season, srad]):
        t_val = float(cast(float, t_season))
        vpd_val = float(cast(float, vpd_season))
        srad_val = float(cast(float, srad))

        pet_daily = (
            0.0016 *
            (t_val + 15.0) *
            np.sqrt(np.clip(vpd_val, 0.1, 4.0)) *
            (srad_val / 3.2)
        )
        row["s_pet_sum"] = pet_daily * (n * 30.4)
    else:
        row["s_pet_sum"] = np.nan

    # --- Engineered seasonal features ---
    pet = row.get("s_pet_sum")
    precip = row.get("s_precip_sum")
    ndvi = row.get("s_ndvi_mean")
    ndwi = row.get("s_ndwi_mean")
    clay = row.get("soil_clay")
    soc = row.get("soil_soc")
    sand = row.get("soil_sand")
    silt = row.get("soil_silt")
    n_val = row.get("soil_nitrogen")
    cec = row.get("soil_cec")

    row["s_water_deficit"] = ((pet - precip) / (pet + 1)) if pd.notna(pet) and pd.notna(precip) else np.nan
    row["s_veg_water_signal"] = (ndvi * ndwi) if pd.notna(ndvi) and pd.notna(ndwi) else np.nan
    row["s_soil_water_retention"] = (clay * soc) if pd.notna(clay) and pd.notna(soc) else np.nan
    row["s_aridity"] = (pet ** 1.12) / (precip + 1e-6) if pd.notna(precip) and pd.notna(pet) else np.nan
    heat_stress = (t_season * vpd_season) if pd.notna(t_season) and pd.notna(vpd_season) else np.nan
    row["s_heat_stress"] = np.clip(heat_stress, 0, 80)
    
    safe_aridity = np.log1p(row["s_aridity"]) if pd.notna(row["s_aridity"]) else np.nan
    ndwi_val = np.clip(ndwi, 0, 1) if pd.notna(ndwi) else np.nan
    if pd.notna(heat_stress) and pd.notna(safe_aridity) and pd.notna(ndwi_val):
        row["s_desert_stress"] = np.log1p(heat_stress) * np.log1p(safe_aridity) * (1 - ndwi_val)
    else:
        row["s_desert_stress"] = np.nan
        
    row["sand_silt_ratio"] = (sand / (silt + 1)) if pd.notna(silt) and pd.notna(sand) else np.nan
    if all(pd.notna(v) for v in [soc, n_val, cec]):
        soc_val = float(cast(float, soc))
        n_val_f = float(cast(float, n_val))
        cec_val = float(cast(float, cec))
        row["fertility_index"] = 0.4 * soc_val + 0.3 * n_val_f + 0.3 * cec_val
    else:
        row["fertility_index"] = np.nan

    # Soil texture class
    if pd.notna(clay) and clay > 35:
        row["soil_texture_class"] = "Clay"
    elif pd.notna(sand) and sand > 60:
        row["soil_texture_class"] = "Sandy"
    else:
        row["soil_texture_class"] = "Loam"
        
    return row
