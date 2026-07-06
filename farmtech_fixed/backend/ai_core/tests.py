import json
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from ai_core.models import CropField
from farms.models import Farm

User = get_user_model()


class AICoreAPITests(APITestCase):

    def setUp(self):
        # Create user
        self.user = User.objects.create_user(
            email="testuser@example.com",
            username="testuser",
            password="testpassword123"
        )
        # Create farm
        self.farm = Farm.objects.create(
            user=self.user,
            name="Test Farm",
            location="Cairo, Egypt",
            soil_type="Clay loam",
            latitude=30.05,
            longitude=31.22
        )
        
        # Populate dynamic DB crop field data for ML nearest-neighbor lookup
        self.field = CropField.objects.create(
            field_id="FLD-TEST123",
            lat=30.08,
            lon=31.25,
            crop="wheat",
            year=2024,
            harv_area=5.0,
            soil_ph=7.2,
            soil_soc=1.8,
            soil_clay=32.0,
            soil_sand=42.0,
            soil_silt=26.0,
            soil_nitrogen=1.6,
            soil_cec=19.5,
            soil_bd=1.32,
            soil_cfvo=1.5,
            soil_ocd=2.1,
            temp_mean=24.5,
            precip_sum=85.0,
            aet_mean=40.0,
            pet_mean=120.0,
            vpd_mean=1.8,
            soil_moisture=35.0,
            ndvi_mean=0.62,
            ndvi_max=0.82,
            ndvi_min=0.22,
            ndvi_amplitude=0.6,
            evi_mean=0.45,
            lswi_mean=0.35,
            ndre_mean=0.55,
            ndre_max=0.75,
            sar_vv_mean=-12.5,
            sar_vh_mean=-18.2,
            sar_vv_vh_ratio=0.68,
            soil_texture_class="Loam",
            fertility_index=0.65,
            aridity_index=0.71,
            water_balance=45.0,
            wheat_sar_signal=0.42,
            extra_data={"ndvi_m01": 0.45, "sar_vv_m01": -11.2}
        )

    def test_health_check_endpoint(self):
        """Test public health check endpoint returns 200."""
        url = reverse("health-check")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "ok")

    def test_crop_recommendation_happy_path(self):
        """Test crop recommendation returns prediction based on GEE/DB coordinates."""
        url = reverse("ai_core:crop_recommendation")
        data = {
            "data": {
                "lat": 30.08,
                "lon": 31.25,
                "crop": "wheat"
            }
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["data"]["status"], "success")
        self.assertIn("predicted_crop", response.data["data"])

    def test_fertilizer_optimizer_happy_path(self):
        """Test fertilizer optimizer works end-to-end and returns correct NPK recommendation."""
        url = reverse("ai_core:fertilizer_optimizer")
        data = {
            "data": {
                "lat": 30.08,
                "lon": 31.25,
                "crop": "wheat"
            }
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["data"]["status"], "success")
        self.assertIn("fertilizer_recommendations", response.data["data"])
        self.assertIn("urea_kg_ha", response.data["data"]["fertilizer_recommendations"])

    def test_irrigation_optimizer_happy_path(self):
        """Test seasonal irrigation prediction logic fetches correctly."""
        url = reverse("ai_core:irrigation_optimizer")
        data = {
            "data": {
                "lat": 30.08,
                "lon": 31.25,
                "crop": "wheat",
                "year": 2024
            }
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertIn("irrigation_need_mm_season", response.data["data"])

    def test_soil_health_happy_path(self):
        """Test soil health score is calculated based on soil chemistry."""
        url = reverse("ai_core:soil_health")
        data = {
            "data": {
                "lat": 30.08,
                "lon": 31.25
            }
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertIn("health_score", response.data["data"])
        self.assertIn("status_label", response.data["data"])

    def test_yield_prediction_happy_path(self):
        """Test yield prediction ML endpoint execution."""
        url = reverse("ai_core:yield_prediction")
        data = {
            "data": {
                "lat": 30.08,
                "lon": 31.25,
                "crop": "wheat",
                "year": 2024
            }
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertIn("yield_value", response.data["data"])

    def test_price_forecast_happy_path(self):
        """Test commodities price forecasting."""
        url = reverse("ai_core:forecast")
        # Test commodity list
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertIn("commodities", response.data)

        # Test single commodity
        response = self.client.get(f"{url}?commodity=Wheat")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["commodity"], "Wheat")
        self.assertIn("forecast", response.data)

    def test_validation_errors(self):
        """Test input fields with empty or invalid structures return 400."""
        url = reverse("ai_core:yield_prediction")
        # Completely invalid JSON
        response = self.client.post(url, "invalid-raw-string", content_type="application/json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])

    def test_not_found_commodity(self):
        """Test request to forecast for an invalid commodity."""
        url = reverse("ai_core:forecast")
        response = self.client.get(f"{url}?commodity=NonExistentCrop")
        self.assertEqual(response.status_code, status.HTTP_502_BAD_GATEWAY)
        self.assertFalse(response.data["success"])

    def test_edge_cases_coordinates(self):
        """Test edge cases with out of bound or invalid coordinates."""
        url = reverse("ai_core:soil_health")
        # Extremely large numbers, string inputs inside numeric fields
        data = {
            "data": {
                "lat": "invalid-lat",
                "lon": -999.0
            }
        }
        response = self.client.post(url, data, format="json")
        # Should raise ValueError and fallback gracefully or return 400
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])

    def test_crop_field_crud(self):
        """Test CRUD actions and relationships on CropField entity."""
        # Create
        field = CropField.objects.create(
            field_id="FLD-CRUD-TEST",
            lat=29.0,
            lon=30.0,
            crop="cotton",
            year=2024
        )
        self.assertEqual(CropField.objects.filter(field_id="FLD-CRUD-TEST").count(), 1)

        # Update
        field.crop = "barley"
        field.save()
        self.assertEqual(CropField.objects.get(field_id="FLD-CRUD-TEST").crop, "barley")

        # Delete
        field.delete()
        self.assertEqual(CropField.objects.filter(field_id="FLD-CRUD-TEST").count(), 0)
