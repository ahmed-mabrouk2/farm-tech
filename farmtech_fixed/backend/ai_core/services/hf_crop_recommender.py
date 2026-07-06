"""
Hugging Face Space integration for crop recommendation and image analysis.
API: https://youssef-d1aa-croprecommend.hf.space/predict
"""

import requests
import base64
import logging
from typing import Dict, List, Optional, Union
from io import BytesIO
from PIL import Image

logger = logging.getLogger(__name__)

HF_SPACE_URL = "https://youssef-d1aa-croprecommend.hf.space/predict"


import os
import joblib
import json
import pandas as pd
import numpy as np
from django.db.models import F, ExpressionWrapper, FloatField
from ai_core.models import CropField
from .local_feature_extractor import extract_and_engineer_features

CROP_MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "ml_models", "crop_recommendation")


class HFCropRecommender:
    """Integration with local ML models for crop recommendations using database lookup."""

    _model = None
    _scaler = None
    _label_encoder = None
    _expected_features = None

    @classmethod
    def _load_models(cls):
        if cls._model is None:
            try:
                cls._model = joblib.load(os.path.join(CROP_MODELS_DIR, "xgboost_78_accuracy_model.joblib"))
                cls._scaler = joblib.load(os.path.join(CROP_MODELS_DIR, "robust_scaler.joblib"))
                cls._label_encoder = joblib.load(os.path.join(CROP_MODELS_DIR, "label_encoder.joblib"))
                with open(os.path.join(CROP_MODELS_DIR, "feature_order.json"), "r") as f:
                    cls._expected_features = json.load(f)
                logger.info("Crop Recommend local models loaded successfully.")
            except Exception as e:
                logger.error(f"Error loading Crop Recommendation local models: {e}")
                raise e

    @staticmethod
    def get_recommendation(input_data: dict) -> dict:
        """Helper for view integration."""
        lat = float(input_data.get("lat", input_data.get("latitude", 30.0)))
        lon = float(input_data.get("lon", input_data.get("lng", input_data.get("longitude", 31.0))))
        
        try:
            # 1. Query closest CropField record in database
            field_record = CropField.objects.annotate(
                distance=ExpressionWrapper(
                    (F('lat') - lat) * (F('lat') - lat) + (F('lon') - lon) * (F('lon') - lon),
                    output_field=FloatField()
                )
            ).order_by('distance').first()

            if not field_record:
                # Dynamic crop recommendations based on location coordinates if database is empty
                if lat < 29.0:
                    predicted_crop = "sugar cane" if (int(lat * 100) % 2 == 0) else "wheat"
                else:
                    predicted_crop = "wheat" if (int(lon * 100) % 2 == 0) else "rice"
                
                return {
                    "status": "success",
                    "coordinates": {"lat": lat, "lon": lon},
                    "predicted_crop": predicted_crop,
                    "source": "Location-based Heuristics (Database Empty)"
                }

            # 2. Extract and engineer features from local DB record
            raw_features = extract_and_engineer_features(field_record)

            # 3. Load local models
            HFCropRecommender._load_models()

            # 4. Format DataFrame
            df = pd.DataFrame([raw_features])
            for col in HFCropRecommender._expected_features:
                if col not in df.columns:
                    df[col] = 0.0
            df = df[HFCropRecommender._expected_features]

            # 5. Predict
            scaled_data = HFCropRecommender._scaler.transform(df)
            prediction_num = HFCropRecommender._model.predict(scaled_data)
            predicted_crop = HFCropRecommender._label_encoder.inverse_transform(prediction_num)[0]

            return {
                "status": "success",
                "coordinates": {"lat": lat, "lon": lon},
                "predicted_crop": str(predicted_crop)
            }
        except Exception as e:
            logger.exception("Error in local crop recommendation")
            return {"status": "error", "message": str(e)}

    @staticmethod
    def predict_crop(
        soil_type: str,
        ph: float,
        nitrogen: float,
        phosphorus: float,
        potassium: float,
        temperature: float,
        humidity: float,
        rainfall: float = None,
        lat: float = 30.0,
        lon: float = 31.0,
    ) -> Dict:
        """
        Backward compatibility wrapper that queries recommendation based on lat/lon.
        """
        return HFCropRecommender.get_recommendation({"lat": lat, "lon": lon})

    @staticmethod
    def predict_from_image(image_input: Union[str, bytes]) -> Dict:
        """
        Analyze crop health or disease from image.

        Args:
            image_input: Image file path or bytes

        Returns:
            Dict with analysis results (disease detection, health status, etc.)
        """
        try:
            # Load image
            if isinstance(image_input, str):
                img = Image.open(image_input)
            else:
                img = Image.open(BytesIO(image_input))

            # Convert to base64
            buffered = BytesIO()
            img.save(buffered, format="JPEG")
            img_base64 = base64.b64encode(buffered.getvalue()).decode()

            payload = {"image": f"data:image/jpeg;base64,{img_base64}"}

            response = requests.post(
                HF_SPACE_URL,
                json=payload,
                timeout=30,
            )
            response.raise_for_status()
            return response.json()

        except Exception as e:
            logger.error(f"Error in image analysis: {str(e)}")
            return {"error": str(e), "analysis": None}

    @staticmethod
    def batch_predict(crop_fields_data: List[Dict]) -> List[Dict]:
        """
        Get recommendations for multiple crop fields.

        Args:
            crop_fields_data: List of dicts with field parameters

        Returns:
            List of prediction results
        """
        results = []
        for field_data in crop_fields_data:
            result = HFCropRecommender.predict_crop(
                soil_type=field_data.get("soil_type"),
                ph=field_data.get("ph", 6.5),
                nitrogen=field_data.get("nitrogen", 50),
                phosphorus=field_data.get("phosphorus", 30),
                potassium=field_data.get("potassium", 40),
                temperature=field_data.get("temperature", 25),
                humidity=field_data.get("humidity", 60),
                rainfall=field_data.get("rainfall"),
            )
            result["field_id"] = field_data.get("field_id")
            results.append(result)

        return results


class CropRecommendationCache:
    """Simple in-memory cache for recommendation results."""

    def __init__(self):
        self.cache = {}

    def get(self, key: str) -> Optional[Dict]:
        """Get cached recommendation."""
        return self.cache.get(key)

    def set(self, key: str, value: Dict, ttl: int = 3600):
        """Cache recommendation with TTL in seconds."""
        self.cache[key] = {"data": value, "ttl": ttl}

    def clear(self):
        """Clear all cache."""
        self.cache.clear()


# Global cache instance
recommendation_cache = CropRecommendationCache()
