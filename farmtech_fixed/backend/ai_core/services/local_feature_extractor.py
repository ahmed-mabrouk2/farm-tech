import numpy as np

def extract_and_engineer_features(field_record) -> dict:
    """
    Extracts soil and climate properties from a CropField database record
    and engineers all 195 monthly/derived features required by the crop 
    recommender and yield predictor models locally.
    """
    months = list(range(1, 13))
    features = {}

    # 1. Soil static properties
    soil_fields = [
        "soil_bd", "soil_cec", "soil_cfvo", "soil_clay", 
        "soil_nitrogen", "soil_ocd", "soil_ph", "soil_sand", 
        "soil_silt", "soil_soc"
    ]
    for sf in soil_fields:
        val = getattr(field_record, sf, 0.0)
        features[sf] = float(val) if val is not None else 0.0

    # 2. Extract monthly variables from extra_data, falling back to annual means
    extra = field_record.extra_data or {}
    
    # Get annual values for fallback
    ndvi_mean = getattr(field_record, "ndvi_mean", 0.0) or 0.0
    evi_mean = getattr(field_record, "evi_mean", 0.0) or 0.0
    lswi_mean = getattr(field_record, "lswi_mean", 0.0) or 0.0
    ndre_mean = getattr(field_record, "ndre_mean", 0.0) or 0.0
    sar_vv_mean = getattr(field_record, "sar_vv_mean", 0.0) or 0.0
    sar_vh_mean = getattr(field_record, "sar_vh_mean", 0.0) or 0.0
    temp_mean = getattr(field_record, "temp_mean", 0.0) or 0.0
    precip_sum = getattr(field_record, "precip_sum", 0.0) or 0.0
    vpd_mean = getattr(field_record, "vpd_mean", 0.0) or 0.0
    
    features["temp_mean"] = float(temp_mean)
    features["precip_sum"] = float(precip_sum)
    features["vpd_mean"] = float(vpd_mean)
    features["aet_mean"] = float(getattr(field_record, "aet_mean", 0.0) or 0.0)
    features["soil_moisture"] = float(getattr(field_record, "soil_moisture", 0.0) or 0.0)
    
    # Srad & wind are not columns in model but we can read them from extra or use defaults
    features["srad_mean"] = float(extra.get("srad_mean", 15.0))
    features["wind_mean"] = float(extra.get("wind_mean", 3.0))

    # Add monthly values
    for m in months:
        m_str = f"{m:02d}"
        
        features[f"ndvi_m{m_str}"] = float(extra.get(f"ndvi_m{m_str}", ndvi_mean))
        features[f"evi_m{m_str}"] = float(extra.get(f"evi_m{m_str}", evi_mean))
        features[f"lswi_m{m_str}"] = float(extra.get(f"lswi_m{m_str}", lswi_mean))
        features[f"ndwi_m{m_str}"] = float(extra.get(f"ndwi_m{m_str}", 0.0))
        features[f"savi_m{m_str}"] = float(extra.get(f"savi_m{m_str}", ndvi_mean * 0.8))
        features[f"ndre_m{m_str}"] = float(extra.get(f"ndre_m{m_str}", ndre_mean))
        features[f"sar_vv_m{m_str}"] = float(extra.get(f"sar_vv_m{m_str}", sar_vv_mean))
        features[f"sar_vh_m{m_str}"] = float(extra.get(f"sar_vh_m{m_str}", sar_vh_mean))
        features[f"temp_m{m_str}"] = float(extra.get(f"temp_m{m_str}", temp_mean))
        features[f"pr_m{m_str}"] = float(extra.get(f"pr_m{m_str}", precip_sum / 12.0))
        features[f"vpd_m{m_str}"] = float(extra.get(f"vpd_m{m_str}", vpd_mean))

    # 3. Aggregates and Fingerprints
    def safe_max(keys):
        vals = [features[k] for k in keys if k in features]
        return max(vals) if vals else 0.0

    def safe_mean(keys):
        vals = [features[k] for k in keys if k in features]
        return float(np.mean(vals)) if vals else 0.0

    def safe_std(keys):
        vals = [features[k] for k in keys if k in features]
        return float(np.std(vals)) if vals else 0.0

    features["ndvi_mean"] = safe_mean([f"ndvi_m{m:02d}" for m in months])
    features["ndvi_max"] = safe_max([f"ndvi_m{m:02d}" for m in months])
    
    # Avoid zero division or negative values in min/amplitude
    ndvi_min_calc = safe_mean([f"ndvi_m{m:02d}" for m in months]) * 0.5
    features["ndvi_min"] = ndvi_min_calc
    features["ndvi_amplitude"] = features["ndvi_max"] - features["ndvi_min"]

    features["evi_mean"] = safe_mean([f"evi_m{m:02d}" for m in months])
    features["evi_max"] = safe_max([f"evi_m{m:02d}" for m in months])

    features["lswi_mean"] = safe_mean([f"lswi_m{m:02d}" for m in months])
    features["lswi_max"] = safe_max([f"lswi_m{m:02d}" for m in months])

    features["ndre_mean"] = safe_mean([f"ndre_m{m:02d}" for m in months])
    features["ndre_max"] = safe_max([f"ndre_m{m:02d}" for m in months])

    features["sar_vv_mean"] = safe_mean([f"sar_vv_m{m:02d}" for m in months])
    features["sar_vh_mean"] = safe_mean([f"sar_vh_m{m:02d}" for m in months])
    features["sar_vv_vh_ratio"] = features["sar_vv_mean"] / (features["sar_vh_mean"] + 0.001)

    # Seasonal Peaks
    features["summer_ndvi_peak"] = safe_max([f"ndvi_m{m:02d}" for m in [7, 8, 9]])
    features["winter_ndvi_peak"] = safe_max([f"ndvi_m{m:02d}" for m in [2, 3, 4]])
    features["spring_ndvi_peak"] = safe_max([f"ndvi_m{m:02d}" for m in [4, 5, 6]])
    features["autumn_ndvi_peak"] = safe_max([f"ndvi_m{m:02d}" for m in [10, 11, 12]])
    features["ndvi_stability"] = 1 - safe_std([f"ndvi_m{m:02d}" for m in months])
    features["winter_summer_ratio"] = features["winter_ndvi_peak"] / (features["summer_ndvi_peak"] + 0.01)

    features["summer_evi_peak"] = safe_max([f"evi_m{m:02d}" for m in [7, 8, 9]])
    features["winter_evi_peak"] = safe_max([f"evi_m{m:02d}" for m in [2, 3, 4]])
    features["evi_stability"] = 1 - safe_std([f"evi_m{m:02d}" for m in months])

    features["rice_flood_signal"] = safe_max([f"lswi_m{m:02d}" for m in [6, 7, 8]])
    features["summer_lswi_peak"] = safe_max([f"lswi_m{m:02d}" for m in [7, 8, 9]])
    features["winter_lswi_peak"] = safe_max([f"lswi_m{m:02d}" for m in [1, 2, 3]])
    features["lswi_stability"] = 1 - safe_std([f"lswi_m{m:02d}" for m in months])

    features["irrigation_signal"] = safe_mean([f"ndwi_m{m:02d}" for m in [6, 7, 8]])
    features["winter_water_signal"] = safe_mean([f"ndwi_m{m:02d}" for m in [1, 2, 3]])

    features["sparse_veg_signal"] = safe_mean([f"savi_m{m:02d}" for m in [3, 4, 10, 11]])
    features["summer_savi_peak"] = safe_max([f"savi_m{m:02d}" for m in [7, 8, 9]])

    features["rice_detector"] = features["rice_flood_signal"] * features["summer_evi_peak"]
    features["wheat_detector"] = features["winter_ndvi_peak"] * features["winter_evi_peak"]
    features["mango_detector"] = features["ndvi_stability"] * features["evi_stability"]
    features["sorghum_detector"] = features["summer_savi_peak"] * features["summer_ndvi_peak"]

    # SAR Detectors
    summer_vv = safe_mean([f"sar_vv_m{m:02d}" for m in [6, 7, 8]])
    summer_vh = safe_mean([f"sar_vh_m{m:02d}" for m in [7, 8, 9]])
    winter_vv = safe_mean([f"sar_vv_m{m:02d}" for m in [1, 2, 3, 4]])
    winter_vh = safe_mean([f"sar_vh_m{m:02d}" for m in [1, 2, 3, 4]])

    features["sar_vv_summer_peak"] = safe_max([f"sar_vv_m{m:02d}" for m in [6, 7, 8]])
    features["rice_sar_signal"] = -summer_vv
    features["maize_sar_signal"] = summer_vh
    features["wheat_sar_signal"] = winter_vv / (winter_vh + 0.001)

    features["summer_ndre_peak"] = safe_max([f"ndre_m{m:02d}" for m in [7, 8, 9]])
    features["winter_ndre_peak"] = safe_max([f"ndre_m{m:02d}" for m in [2, 3, 4]])

    # Agronomic Engineered
    features["temp_precip_ratio"] = features["temp_mean"] / (features["precip_sum"] + 1)
    features["soil_texture_index"] = features["soil_clay"] - features["soil_sand"]
    features["heat_stress"] = features["temp_mean"] * features["vpd_mean"]
    features["water_availability"] = features["precip_sum"] + features["soil_moisture"]
    features["fertility_index"] = (
        features["soil_soc"] * 0.4 +
        features["soil_nitrogen"] * 0.3 +
        features["soil_cec"] * 0.3
    )
    features["aridity_index"] = features["precip_sum"] / max(features.get("pet_mean", features["precip_sum"]), 0.1)

    return features
