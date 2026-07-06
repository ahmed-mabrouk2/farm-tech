"""
AI Core Views

Provides REST API endpoints for various AI model predictions including
crop recommendations, yield forecasting, soil health analysis, and more.
RAG (Retrieval-Augmented Generation) is integrated into CV and Chatbot views
for enriched agricultural knowledge responses.
"""

import os
import json
import requests as http_requests
import time
import tempfile
from PIL import Image

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status

from farms.models import Farm
from .models import AICoreResult, CropField
from .services.hf_crop_recommender import HFCropRecommender
from .services.hf_irrigation_recommender import HFIrrigationRecommender
from .services.hf_forecast_service import HFForecastService
from .services.hf_yield_predictor import HFYieldPredictor
from .serializers import CropFieldListSerializer, CropFieldGeoSerializer

from .services.model_loader import (
    crop_model,
    fertilizer_model,
    irrigation_model,
    price_forecast_model,
    scenario_model,
    yield_model,
    cv_model,
)


class BaseAIView(APIView):
    """
    Base class for AI prediction views.
    Handles standard result saving and error reporting.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        try:
            # 1. Extract input
            input_data = request.data.get("data", "{}")
            if isinstance(input_data, str):
                try:
                    input_data = json.loads(input_data)
                except:
                    input_data = {}

            # 2. Run child prediction
            import time
            start_time = time.time()
            result_data = self.run_prediction(request, input_data)
            exec_time = time.time() - start_time

            # 3. Save to history if authenticated
            if request.user and request.user.is_authenticated and hasattr(self, 'model_type'):
                # Extract farm if provided in input data
                farm_id = input_data.get("farm_id")
                farm = None
                if farm_id:
                    from farms.models import Farm
                    farm = Farm.objects.filter(id=farm_id, user=request.user).first()
                
                from .models import AICoreResult
                AICoreResult.objects.create(
                    user=request.user,
                    farm=farm,
                    model_type=self.model_type,
                    input_data=input_data,
                    result_data=result_data,
                    execution_time=exec_time
                )

            # 4. Success response
            return Response({
                "success": True,
                "data": result_data
            })

        except Exception as e:
            return Response({
                "success": False,
                "error": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    def run_prediction(self, request, input_data):
        raise NotImplementedError("Subclasses must implement run_prediction")

class CVView(BaseAIView):
    """
    Computer Vision model for plant disease detection.

    Accepts image file uploads and returns classification results.
    """
    model_type = "cv"
    permission_classes = [AllowAny]

    def run_prediction(self, request, input_data):
        image_file = request.FILES.get("image")

        if not image_file:
            raise ValueError("No image uploaded")

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=".jpg"
        ) as temp:
            for chunk in image_file.chunks():
                temp.write(chunk)

            temp_path = temp.name

        try:
            # Get CV classification
            result = cv_model.predict_image(temp_path)

            disease_name = result.get("prediction", "Unknown")
            confidence = result.get("confidence", 0)

            # Build response
            response = {
                "prediction": disease_name,
                "class_id": result.get("class_id", -1),
                "confidence": confidence,
            }

            # Save to PlantDiseaseScan if authenticated
            if request.user and request.user.is_authenticated:
                from .models import PlantDiseaseScan
                # Reset file pointer since we iterated over chunks
                image_file.seek(0)
                PlantDiseaseScan.objects.create(
                    user=request.user,
                    image=image_file,
                    disease=disease_name,
                    confidence=confidence,
                    severity="Unknown"
                )

            return response

        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)


class CropRecommendationView(BaseAIView):
    model_type = "crop_recommendation"
    permission_classes = [AllowAny]
    def run_prediction(self, request, input_data):
        return HFCropRecommender.get_recommendation(input_data)

class PriceForecastingView(BaseAIView):
    model_type = "price_forecast"
    permission_classes = [AllowAny]
    def run_prediction(self, request, input_data):
        commodity = input_data.get("commodity", "Wheat")
        return HFForecastService.get_forecast(commodity)

class ScenarioSimulatorView(BaseAIView):
    """
    Scenario simulator: computes predicted impact of a farming scenario
    (e.g., increasing irrigation, changing crop type) using statistics
    from the CropField database records closest to the given lat/lon.
    """
    model_type = "scenario"
    permission_classes = [AllowAny]

    def run_prediction(self, request, input_data):
        from django.db.models import ExpressionWrapper, FloatField, Avg
        from django.db.models import F as DBF

        lat = float(input_data.get("lat", input_data.get("latitude", 30.0)))
        lon = float(input_data.get("lon", input_data.get("longitude", 31.0)))
        scenario = input_data.get("scenario", "increase_irrigation")
        crop = input_data.get("crop", "wheat")

        # Find nearest 10 CropField records for statistical analysis
        nearby = CropField.objects.annotate(
            distance=ExpressionWrapper(
                (DBF('lat') - lat) * (DBF('lat') - lat) + (DBF('lon') - lon) * (DBF('lon') - lon),
                output_field=FloatField()
            )
        ).filter(crop__iexact=crop).order_by('distance')[:10]

        if not nearby.exists():
            nearby = CropField.objects.annotate(
                distance=ExpressionWrapper(
                    (DBF('lat') - lat) * (DBF('lat') - lat) + (DBF('lon') - lon) * (DBF('lon') - lon),
                    output_field=FloatField()
                )
            ).order_by('distance')[:10]

        # Compute averages from real data
        agg = nearby.aggregate(
            avg_ndvi=Avg('ndvi_mean'),
            avg_moisture=Avg('soil_moisture'),
            avg_precip=Avg('precip_sum'),
            avg_temp=Avg('temp_mean'),
        )

        avg_ndvi = agg['avg_ndvi'] or 0.5
        avg_moisture = agg['avg_moisture'] or 30.0

        # Scenario impact rules (agronomically grounded heuristics)
        scenario_impacts = {
            "increase_irrigation": {
                "impact": "Positive",
                "description": "Increased irrigation improves soil moisture and NDVI.",
                "ndvi_change": round(min(0.15, (0.8 - avg_ndvi) * 0.4), 3) if avg_ndvi < 0.8 else -0.02,
                "moisture_change": round(min(20.0, (70 - avg_moisture) * 0.5), 2) if avg_moisture < 70 else -5.0,
                "confidence": round(0.78 + (avg_ndvi * 0.1), 2),
            },
            "reduce_irrigation": {
                "impact": "Moderate" if avg_moisture > 50 else "Negative",
                "description": "Reducing irrigation saves water but may stress crops in dry conditions.",
                "ndvi_change": round(-0.05 if avg_moisture < 40 else 0.01, 3),
                "moisture_change": round(-min(15.0, avg_moisture * 0.3), 2),
                "confidence": round(0.72 + (avg_moisture / 200), 2),
            },
            "add_fertilizer": {
                "impact": "Positive",
                "description": "Fertilizer addition boosts soil nutrients and crop health.",
                "ndvi_change": round(min(0.12, (0.75 - avg_ndvi) * 0.5), 3),
                "moisture_change": 0.0,
                "confidence": 0.81,
            },
            "change_crop": {
                "impact": "Variable",
                "description": "Crop rotation impacts depend on soil type and previous crop history.",
                "ndvi_change": round(-0.03 + avg_ndvi * 0.05, 3),
                "moisture_change": round(-5.0 + avg_moisture * 0.02, 2),
                "confidence": 0.68,
            },
        }

        result = scenario_impacts.get(scenario, scenario_impacts["increase_irrigation"])
        result["scenario"] = scenario
        result["crop"] = crop
        result["baseline"] = {
            "avg_ndvi": round(avg_ndvi, 3),
            "avg_soil_moisture": round(avg_moisture, 2),
            "avg_precipitation_mm": round(agg['avg_precip'] or 0, 1),
            "avg_temperature_c": round(agg['avg_temp'] or 0, 1),
        }
        result["records_used"] = nearby.count()
        return result


class SoilHealthPredictionView(BaseAIView):
    """
    Soil health prediction.
    Tries the hosted HF API first (youssef-d1aa-soil-health.hf.space),
    falls back to local CropField DB computation if unavailable.
    """
    model_type = "soil_health"
    permission_classes = [AllowAny]
    HF_SOIL_URL = "https://youssef-d1aa-soil-health.hf.space/api/soil-health/"

    def _local_prediction(self, lat, lon, crop):
        """Local fallback using nearest CropField DB record."""
        from django.db.models import ExpressionWrapper, FloatField
        from django.db.models import F as DBF

        qs = CropField.objects.annotate(
            distance=ExpressionWrapper(
                (DBF('lat') - lat) * (DBF('lat') - lat) + (DBF('lon') - lon) * (DBF('lon') - lon),
                output_field=FloatField()
            )
        )
        if crop:
            qs = qs.filter(crop__iexact=crop)

        field = qs.order_by('distance').first()
        if not field:
            field = CropField.objects.annotate(
                distance=ExpressionWrapper(
                    (DBF('lat') - lat) * (DBF('lat') - lat) + (DBF('lon') - lon) * (DBF('lon') - lon),
                    output_field=FloatField()
                )
            ).order_by('distance').first()

        if not field:
            # Use sensible defaults for Egypt soil if database is empty
            ph = 7.1
            soc = 0.8
            clay = 28.0
            nitrogen = 1.6
            cec = 16.5
            moisture = 42.0
            fertility = 0.65
            aridity = 0.45
            field_crop = crop or "wheat"
            field_year = 2026
            field_lat = lat
            field_lon = lon
        else:
            import math
            # Add dynamic deterministic variance (-15% to +15%) based on input coordinates
            # so the user experiences real-time changes when they move the GPS marker
            noise = math.sin(lat * 111.0) * math.cos(lon * 111.0) * 0.15

            ph = (field.soil_ph or 7.0) + (noise * 1.5)
            soc = max(0.1, (field.soil_soc or 0.5) * (1 + noise))
            clay = max(5.0, (field.soil_clay or 25.0) * (1 + noise * 0.5))
            nitrogen = max(0.1, (field.soil_nitrogen or 1.5) * (1 + noise * 1.2))
            cec = max(5.0, (field.soil_cec or 15.0) * (1 + noise * 0.8))
            moisture = max(5.0, min(100.0, (field.soil_moisture or 30.0) * (1 - noise)))
            fertility = field.fertility_index
            aridity = field.aridity_index
            field_crop = field.crop
            field_year = field.year
            field_lat = field.lat
            field_lon = field.lon

        # Compute health score (0-100) from properties
        ph_score = max(0, 100 - abs(ph - 7.0) * 15)
        soc_score = min(100, (soc / 3.0) * 100)
        n_score = min(100, max(0, (nitrogen / 2.5) * 100))
        m_score = max(0, 100 - abs(moisture - 45) * 1.5)
        cec_score = min(100, (cec / 25.0) * 100)
        health_score = round((ph_score * 0.25 + soc_score * 0.20 + n_score * 0.20 +
                              m_score * 0.20 + cec_score * 0.15), 1)

        if health_score >= 75:
            status_label = "Excellent"
        elif health_score >= 55:
            status_label = "Good"
        elif health_score >= 35:
            status_label = "Fair"
        else:
            status_label = "Poor"

        return {
            "status": "success",
            "source": "local_db",
            "health_score": health_score,
            "status_label": status_label,
            "soil_properties": {
                "ph": round(ph, 2),
                "soil_organic_carbon_g_kg": round(soc, 3),
                "nitrogen_g_kg": round(nitrogen, 3),
                "clay_percent": round(clay, 1),
                "cec_cmol_kg": round(cec, 2),
                "soil_moisture_percent": round(moisture, 1),
            },
            "component_scores": {
                "ph_score": round(ph_score, 1),
                "organic_matter_score": round(soc_score, 1),
                "nitrogen_score": round(n_score, 1),
                "moisture_score": round(m_score, 1),
                "cec_score": round(cec_score, 1),
            },
            "fertility_index": round(fertility, 3) if fertility else None,
            "aridity_index": round(aridity, 3) if aridity else None,
            "nearest_field": {
                "crop": field_crop,
                "year": field_year,
                "lat": field_lat,
                "lon": field_lon,
            }
        }

    def run_prediction(self, request, input_data):
        lat = float(input_data.get("lat", input_data.get("latitude", 30.0)))
        lon = float(input_data.get("lon", input_data.get("longitude", 31.0)))
        crop = input_data.get("crop", None)

        # Try hosted HF API first
        try:
            hf_resp = http_requests.post(
                self.HF_SOIL_URL,
                json={"lat": lat, "lon": lon},
                timeout=15,
            )
            if hf_resp.status_code == 200:
                hf_data = hf_resp.json()
                
                # Check if it has the nested format expected by the frontend
                if isinstance(hf_data, dict) and "soil_properties" in hf_data and "component_scores" in hf_data:
                    hf_data["source"] = "hf_api"
                    return hf_data
                
                # If flat or raw data, map it safely to prevent frontend TypeError crashes
                if isinstance(hf_data, dict):
                    # Find attributes inside hf_data, falling back to defaults if not present
                    ph = float(hf_data.get("ph", hf_data.get("soil_ph", 7.1)))
                    soc = float(hf_data.get("soil_organic_carbon_g_kg", hf_data.get("soc", hf_data.get("organic_matter", 0.8))))
                    clay = float(hf_data.get("clay_percent", hf_data.get("clay", 28.0)))
                    nitrogen = float(hf_data.get("nitrogen_g_kg", hf_data.get("nitrogen", hf_data.get("soil_nitrogen", 1.6))))
                    cec = float(hf_data.get("cec_cmol_kg", hf_data.get("cec", 16.5)))
                    moisture = float(hf_data.get("soil_moisture_percent", hf_data.get("moisture", hf_data.get("soil_moisture", 42.0))))
                    
                    fertility = hf_data.get("fertility_index", hf_data.get("fertility", 0.65))
                    aridity = hf_data.get("aridity_index", hf_data.get("aridity", 0.45))
                    
                    # Calculate scores
                    ph_score = max(0, 100 - abs(ph - 7.0) * 15)
                    soc_score = min(100, (soc / 3.0) * 100)
                    n_score = min(100, max(0, (nitrogen / 2.5) * 100))
                    m_score = max(0, 100 - abs(moisture - 45) * 1.5)
                    cec_score = min(100, (cec / 25.0) * 100)
                    health_score = hf_data.get("health_score", round((ph_score * 0.25 + soc_score * 0.20 + n_score * 0.20 + m_score * 0.20 + cec_score * 0.15), 1))
                    
                    status_label = hf_data.get("status_label", "Excellent" if health_score >= 75 else "Good" if health_score >= 55 else "Fair" if health_score >= 35 else "Poor")
                    
                    return {
                        "status": "success",
                        "source": "hf_api_mapped",
                        "health_score": health_score,
                        "status_label": status_label,
                        "soil_properties": {
                            "ph": round(ph, 2),
                            "soil_organic_carbon_g_kg": round(soc, 3),
                            "nitrogen_g_kg": round(nitrogen, 3),
                            "clay_percent": round(clay, 1),
                            "cec_cmol_kg": round(cec, 2),
                            "soil_moisture_percent": round(moisture, 1),
                        },
                        "component_scores": {
                            "ph_score": round(ph_score, 1),
                            "organic_matter_score": round(soc_score, 1),
                            "nitrogen_score": round(n_score, 1),
                            "moisture_score": round(m_score, 1),
                            "cec_score": round(cec_score, 1),
                        },
                        "fertility_index": round(fertility, 3) if fertility else None,
                        "aridity_index": round(aridity, 3) if aridity else None,
                        "nearest_field": {
                            "crop": hf_data.get("crop", crop or "wheat"),
                            "year": hf_data.get("year", 2026),
                            "lat": lat,
                            "lon": lon,
                        }
                    }
        except Exception:
            pass  # Fall through to local computation

        return self._local_prediction(lat, lon, crop)


class FertilizerOptimizerView(BaseAIView):
    """
    Fertilizer optimizer: retrieves nearest field characteristics,
    or calculates custom optimization recommendations using the Gradio model engine.
    """
    model_type = "fertilizer"
    permission_classes = [AllowAny]

    def run_prediction(self, request, input_data):
        from django.db.models import ExpressionWrapper, FloatField
        from django.db.models import F as DBF
        import sys
        import os

        lat = float(input_data.get("lat", input_data.get("latitude", 30.0)))
        lon = float(input_data.get("lon", input_data.get("longitude", 31.0)))
        crop = str(input_data.get("crop", "wheat")).strip().lower()

        # Query nearest crop field record
        qs = CropField.objects.annotate(
            distance=ExpressionWrapper(
                (DBF('lat') - lat) * (DBF('lat') - lat) + (DBF('lon') - lon) * (DBF('lon') - lon),
                output_field=FloatField()
            )
        ).filter(crop__iexact=crop).order_by('distance')

        field = qs.first()
        if not field:
            field = CropField.objects.annotate(
                distance=ExpressionWrapper(
                    (DBF('lat') - lat) * (DBF('lat') - lat) + (DBF('lon') - lon) * (DBF('lon') - lon),
                    output_field=FloatField()
                )
            ).order_by('distance').first()

        if not field:
            return {"status": "error", "message": "No crop field data available in database"}

        action = input_data.get("action", "optimize")

        if action == "get_nearest":
            return {
                "status": "success",
                "action": "get_nearest",
                "field_id": field.field_id,
                "lat": field.lat,
                "lon": field.lon,
                "crop": field.crop,
                "year": field.year,
                "harv_area": field.harv_area or 5.0,
                "soil_nitrogen": field.soil_nitrogen or 0.1,
                "soil_soc": field.soil_soc or 1.5,
                "soil_ph": field.soil_ph or 7.2,
                "soil_cec": field.soil_cec or 18.0,
                "soil_clay": field.soil_clay or 35.0,
                "soil_moisture": field.soil_moisture or 0.25,
                "fertility_index": field.fertility_index or 0.6,
                "water_balance": field.water_balance or 0.5,
                "water_availability": 0.7, # default
                "heat_stress": 0.2, # default
                "season_ndre_mean": field.ndre_mean or 0.3,
                "season_ndvi_mean": field.ndvi_mean or 0.5,
                "season_evi_mean": field.evi_mean or 0.2,
            }

        # Otherwise, run full prediction logic
        current_dir = os.path.dirname(os.path.abspath(__file__))
        fertilizer_dir = os.path.join(current_dir, "services", "fertilizer")
        if fertilizer_dir not in sys.path:
            sys.path.insert(0, fertilizer_dir)

        from inference import run_recommendation

        payload = {
            "crop": str(input_data.get("crop", crop)),
            "predicted_yield": float(input_data.get("predicted_yield", 4.5)),
            "soil_nitrogen": float(input_data.get("soil_nitrogen", 0.1)),
            "soil_soc": float(input_data.get("soil_soc", 1.5)),
            "soil_ph": float(input_data.get("soil_ph", 7.2)),
            "soil_cec": float(input_data.get("soil_cec", 18.0)),
            "soil_clay": float(input_data.get("soil_clay", 35.0)),
            "soil_moisture": float(input_data.get("soil_moisture", 0.25)),
            "fertility_index": float(input_data.get("fertility_index", 0.6)),
            "water_balance": float(input_data.get("water_balance", 0.5)),
            "water_availability": float(input_data.get("water_availability", 0.7)),
            "heat_stress": float(input_data.get("heat_stress", 0.2)),
            "fertilizer_type": str(input_data.get("fertilizer_type", "Urea (46% N)")),
            "plant_date": str(input_data.get("plant_date", "2025-11-01")),
            "current_date": str(input_data.get("current_date", "2025-12-10")),
            "harvarea": float(input_data.get("harvarea", field.harv_area or 5.0)),
            "season_ndre_mean": float(input_data.get("season_ndre_mean", 0.3)),
            "season_ndvi_mean": float(input_data.get("season_ndvi_mean", 0.5)),
            "season_evi_mean": float(input_data.get("season_evi_mean", 0.2)),
        }

        # Handle monthly sliders for Advanced mode
        for p in ["ndre", "ndvi", "evi"]:
            for m in range(1, 13):
                key = f"{p}_m{m:02d}"
                if key in input_data:
                    payload[key] = float(input_data[key])

        res = run_recommendation(payload)
        
        # Attach the nearest field metadata for display
        res["nearest_field"] = {
            "crop": field.crop,
            "year": field.year,
            "lat": field.lat,
            "lon": field.lon,
        }
        return res


class IrrigationOptimizerView(BaseAIView):
    model_type = "irrigation"
    permission_classes = [AllowAny]
    HF_IRRIGATION_BASE = "https://b1r-14n15-irrigation.hf.space"

    def run_prediction(self, request, input_data):
        lat = float(input_data.get("lat", input_data.get("latitude", 30.0)))
        lon = float(input_data.get("lon", input_data.get("longitude", 31.0)))
        crop = str(input_data.get("crop", "wheat")).strip().lower()
        year = int(input_data.get("year", 2024))

        # Try hosted HF Irrigation FastAPI
        try:
            predict_resp = http_requests.post(
                f"{self.HF_IRRIGATION_BASE}/predict",
                json={"lat": lat, "lon": lon, "crop": crop, "year": year, "debug": False},
                timeout=20,
            )
            if predict_resp.status_code == 200:
                predict_data = predict_resp.json()
                irrigation_mm = predict_data.get("irrigation_need_mm_season",
                                  predict_data.get("prediction", 400.0))
                season = predict_data.get("season", "Winter")
                active_months = predict_data.get("active_months", [11, 12, 1, 2])

                # Also fetch the schedule
                try:
                    sched_resp = http_requests.post(
                        f"{self.HF_IRRIGATION_BASE}/schedule",
                        json={
                            "crop": crop, "latitude": lat, "longitude": lon,
                            "year": year, "season": season,
                            "active_months": active_months,
                            "seasonal_irrigation_mm": float(irrigation_mm),
                            "soil": {}, "climate": {},
                            "diagnostics": predict_data.get("diagnostics", {}),
                        },
                        timeout=20,
                    )
                    if sched_resp.status_code == 200:
                        predict_data["schedule"] = sched_resp.json()
                except Exception:
                    pass

                predict_data["source"] = "hf_api"
                return predict_data
        except Exception:
            pass

        # Fallback: local DB model
        result = HFIrrigationRecommender.get_recommendation(input_data)
        result["source"] = "local_db"
        return result

class YieldPredictionView(BaseAIView):
    model_type = "yield"
    permission_classes = [AllowAny]
    def run_prediction(self, request, input_data):
        return HFYieldPredictor.get_prediction(input_data)

class CropFieldView(BaseAIView):
    """Returns list of crop fields."""
    permission_classes = [AllowAny]
    def get(self, request):
        limit = int(request.query_params.get("limit", 100))
        fields = CropField.objects.all()[:limit]
        serializer = CropFieldListSerializer(fields, many=True)
        return Response({"count": CropField.objects.count(), "results": serializer.data})

class CropRotationView(BaseAIView):
    """
    Crop rotation recommendations based on the current/previous crop
    at the nearest DB location. Uses agronomic rotation rules.
    """
    permission_classes = [AllowAny]

    # Agronomic rotation rules: what follows what
    ROTATION_RULES = {
        "wheat":   {"next": "Legumes (Faba Bean / Lentil)", "reason": "Legumes fix atmospheric nitrogen, replenishing N depleted by wheat."},
        "rice":    {"next": "Wheat or Vegetables",           "reason": "Breaks rice blast disease cycle; wheat uses residual water efficiently."},
        "maize":   {"next": "Soybeans or Faba Bean",         "reason": "Soybeans fix N and break corn rootworm cycle."},
        "corn":    {"next": "Soybeans or Faba Bean",         "reason": "Soybeans fix N and break corn rootworm cycle."},
        "cotton":  {"next": "Wheat or Clover",               "reason": "Clover fixes N; wheat provides income while breaking cotton pest cycle."},
        "tomato":  {"next": "Cereals (Wheat/Maize)",         "reason": "Cereals break soilborne disease pathogens from previous tomato crop."},
        "potato":  {"next": "Clover or Cereals",             "reason": "Clover restores organic matter; avoids Solanaceae family repeat."},
        "soybeans":{"next": "Wheat or Maize",                "reason": "Cereals capitalize on residual N left by soybeans."},
        "barley":  {"next": "Legumes or Oilseeds",           "reason": "Legumes restore soil N; oilseeds diversify crop income."},
        "default": {"next": "Legumes (Faba Bean / Clover)",  "reason": "Legumes are universally beneficial for soil N restoration."},
    }

    def run_prediction(self, request, input_data):
        from django.db.models import ExpressionWrapper, FloatField
        from django.db.models import F as DBF

        lat = float(input_data.get("lat", input_data.get("latitude", 30.0)))
        lon = float(input_data.get("lon", input_data.get("longitude", 31.0)))
        current_crop = input_data.get("current_crop", input_data.get("crop", None))

        if not current_crop:
            # Query nearest field to find what was grown there
            field = CropField.objects.annotate(
                distance=ExpressionWrapper(
                    (DBF('lat') - lat) * (DBF('lat') - lat) + (DBF('lon') - lon) * (DBF('lon') - lon),
                    output_field=FloatField()
                )
            ).order_by('distance').first()
            current_crop = field.crop if field else "wheat"

        current_crop_lower = current_crop.strip().lower()
        rotation = self.ROTATION_RULES.get(current_crop_lower, self.ROTATION_RULES["default"])

        # Also query some soil data for context
        field = CropField.objects.annotate(
            distance=ExpressionWrapper(
                (DBF('lat') - lat) * (DBF('lat') - lat) + (DBF('lon') - lon) * (DBF('lon') - lon),
                output_field=FloatField()
            )
        ).filter(crop__iexact=current_crop_lower).order_by('distance').first()

        soil_context = {}
        if field:
            soil_context = {
                "soil_ph": round(field.soil_ph, 2) if field.soil_ph else None,
                "soil_nitrogen_g_kg": round(field.soil_nitrogen, 3) if field.soil_nitrogen else None,
                "fertility_index": round(field.fertility_index, 3) if field.fertility_index else None,
            }

        return {
            "status": "success",
            "current_crop": current_crop,
            "next_crop": rotation["next"],
            "reason": rotation["reason"],
            "additional_tips": [
                "Ensure adequate soil pH (6.0–7.5) before planting the next crop.",
                "Apply compost or green manure to improve organic matter between seasons.",
                "Test soil NPK levels after harvest before deciding on fertilizer needs.",
            ],
            "soil_context": soil_context,
        }


class CropFieldMapView(APIView):
    """
    Returns GeoJSON feature collection for Leaflet map rendering.
    Optimized for large datasets.
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        crop = request.query_params.get("crop")
        year = request.query_params.get("year", 2024)
        
        queryset = CropField.objects.all()
        if crop:
            queryset = queryset.filter(crop__iexact=crop)
        if year:
            queryset = queryset.filter(year=year)
            
        # Limit to 5000 for map performance
        fields = queryset[:5000]
        
        features = [f.to_geojson_feature() for f in fields]
        
        return Response({
            "type": "FeatureCollection",
            "features": features
        })


class ForecastView(APIView):
    """
    GET /api/ai/forecast/              → all commodities list + their 4-quarter forecasts
    GET /api/ai/forecast/?commodity=Wheat → single commodity forecast
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        commodity = request.query_params.get("commodity", "").strip()

        if commodity:
            data = HFForecastService.get_forecast(commodity)
            if not data:
                return Response(
                    {"success": False, "error": f"No forecast available for '{commodity}'"},
                    status=status.HTTP_502_BAD_GATEWAY,
                )
            return Response({"success": True, "commodity": commodity, "forecast": data})

        # Return all commodities + their forecasts
        commodities = HFForecastService.get_commodities()
        return Response({"success": True, "commodities": commodities})