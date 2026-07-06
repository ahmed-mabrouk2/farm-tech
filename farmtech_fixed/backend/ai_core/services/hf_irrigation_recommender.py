import numpy as np
import logging
from ai_core.models import CropField
from django.db.models import F

from .irrigation_config import get_season_info
from .irrigation_feature_engineer import compute_seasonal_features
from .irrigation_predictor import prepare_features, predict, classify_irrigation, feature_names
from .irrigation_validation import validate_prediction

logger = logging.getLogger(__name__)


class HFIrrigationRecommender:
    """Service to run the seasonal geospatial irrigation prediction model locally using the database."""

    @staticmethod
    def get_recommendation(input_data: dict) -> dict:
        """Helper for view integration."""
        return HFIrrigationRecommender.predict_irrigation(input_data)

    @staticmethod
    def predict_irrigation(input_data: dict) -> dict:
        """
        Runs seasonal irrigation prediction locally by pulling historical data from the local database.
        """
        try:
            lat = float(input_data.get("lat", input_data.get("latitude", 30.08)))
            lon = float(input_data.get("lon", input_data.get("longitude", 31.25)))
            crop = str(input_data.get("crop", input_data.get("crop_type", "wheat"))).strip().lower()
            year = int(input_data.get("year", 2024))
            debug = bool(input_data.get("debug", False))

            # 1. Query local CropField records by proximity
            from django.db.models import ExpressionWrapper, FloatField
            field_record = CropField.objects.filter(crop__iexact=crop, year=year).annotate(
                distance=ExpressionWrapper(
                    (F('lat') - lat) * (F('lat') - lat) + (F('lon') - lon) * (F('lon') - lon),
                    output_field=FloatField()
                )
            ).order_by('distance').first()

            if not field_record:
                # Fallback: search for this crop in any year
                field_record = CropField.objects.filter(crop__iexact=crop).annotate(
                    distance=ExpressionWrapper(
                        (F('lat') - lat) * (F('lat') - lat) + (F('lon') - lon) * (F('lon') - lon),
                        output_field=FloatField()
                    )
                ).order_by('distance').first()

            if not field_record:
                logger.warning(f"No CropField record found in database for crop '{crop}'")
                return {"error": f"No historical database records found for crop '{crop}'"}

            # 2. Extract GEE raw features from DB record
            raw_features = {}
            float_fields = [
                'soil_ph', 'soil_soc', 'soil_clay', 'soil_sand', 'soil_silt', 
                'soil_nitrogen', 'soil_cec', 'soil_bd', 'soil_cfvo', 'soil_ocd',
                'temp_mean', 'precip_sum', 'aet_mean', 'pet_mean', 'vpd_mean', 'soil_moisture',
                'ndvi_mean', 'ndvi_max', 'ndvi_min', 'ndvi_amplitude', 'evi_mean', 
                'lswi_mean', 'ndre_mean', 'ndre_max', 'sar_vv_mean', 'sar_vh_mean', 'sar_vv_vh_ratio',
                'fertility_index', 'aridity_index', 'water_balance',
                'rice_sar_signal', 'maize_sar_signal', 'wheat_sar_signal'
            ]
            for f in float_fields:
                val = getattr(field_record, f)
                raw_features[f] = float(val) if val is not None else np.nan

            raw_features['soil_texture_class'] = field_record.soil_texture_class or "Loam"

            # Merge monthly data
            if isinstance(field_record.extra_data, dict):
                for k, v in field_record.extra_data.items():
                    if v is not None:
                        try:
                            raw_features[k] = float(v)
                        except ValueError:
                            raw_features[k] = v
                    else:
                        raw_features[k] = np.nan

            # 3. Get Season Info
            season_info = get_season_info(crop)

            # 4. Engineer Features
            engineered = compute_seasonal_features(raw_features, season_info["active_months"], season=season_info["season"])
            
            # Clean up infinite values
            for k, v in engineered.items():
                if isinstance(v, (float, int)) and np.isinf(v):
                    engineered[k] = np.nan

            # 5. Feature Alignment and Medians Imputation
            df, missing_features, filled_medians = prepare_features(engineered, crop)

            # 6. Model Prediction
            prediction_value, uncertainty, confidence, reliability = predict(df, crop, len(missing_features))

            # 7. Physical/ensemble Validation
            diagnostics = validate_prediction(prediction_value, crop, missing_features)

            # Format Response matching standard schema
            response = {
                "irrigation_need_mm_season": round(prediction_value, 2),
                "irrigation_class": classify_irrigation(prediction_value, crop),
                "confidence": confidence,
                "uncertainty_score": round(uncertainty, 2),
                "reliability_flag": reliability,
                "season": season_info["season"],
                "active_months": season_info["active_months"],
                "diagnostics": diagnostics
            }

            if debug:
                response["debug"] = {
                    "prediction": round(prediction_value, 2),
                    "used_features": len(feature_names),
                    "missing_features": missing_features,
                    "filled_with_medians": {k: float(v) for k, v in filled_medians.items()},
                    "season": season_info["season"],
                    "active_months": season_info["active_months"],
                    "extracted_raw_keys": list(raw_features.keys()),
                    "matched_db_record": str(field_record)
                }

            return response

        except Exception as e:
            logger.exception("Error during local database-based prediction")
            return {"error": f"Local prediction failed: {str(e)}"}
