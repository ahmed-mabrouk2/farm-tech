import random
from datetime import date, timedelta, datetime

from rest_framework import viewsets, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q
from .models import Farm, Plot, SoilRecord, IrrigationSchedule, CropField
from .serializers import FarmSerializer, CropFieldSerializer, CropFieldGeoJSONSerializer, PlotSerializer, IrrigationSerializer


# ---------------------------------------------------------------------------
# Seed helpers
# ---------------------------------------------------------------------------

DEMO_PLOTS = [
    {
        "name": "Wheat Field A",
        "crop_type": "Wheat",
        "area": 4.2,
        "moisture": 62.0,
        "status": "healthy",
        "lat": 30.0444,
        "lon": 31.2357,
        "days_old": 38,
        "harvest_days": 90,
        "color": "#3a8c3f",
        "soil": {"nitrogen": 72, "phosphorus": 45, "potassium": 98, "ph": 7.1, "moisture": 62},
    },
    {
        "name": "Corn Plot B",
        "crop_type": "Corn",
        "area": 2.8,
        "moisture": 55.0,
        "status": "healthy",
        "lat": 30.0590,
        "lon": 31.2450,
        "days_old": 20,
        "harvest_days": 120,
        "color": "#e6a817",
        "soil": {"nitrogen": 58, "phosphorus": 38, "potassium": 110, "ph": 6.8, "moisture": 55},
    },
    {
        "name": "Rice Plot C",
        "crop_type": "Rice",
        "area": 3.5,
        "moisture": 78.0,
        "status": "alert",
        "lat": 30.0320,
        "lon": 31.2200,
        "days_old": 55,
        "harvest_days": 110,
        "color": "#1e7cb8",
        "soil": {"nitrogen": 44, "phosphorus": 52, "potassium": 85, "ph": 6.5, "moisture": 78},
    },
]


def _get_crop_stage(days_old: int, harvest_days: int) -> str:
    pct = days_old / harvest_days if harvest_days > 0 else 0
    if pct < 0.10:
        return "Germination"
    elif pct < 0.25:
        return "Seedling"
    elif pct < 0.50:
        return "Vegetative"
    elif pct < 0.75:
        return "Flowering"
    elif pct < 0.90:
        return "Grain Filling"
    else:
        return "Ripening"


def _seed_demo_farm(user) -> None:
    """Create a demo Cairo farm with 3 plots + soil records + irrigation schedules for a new user."""
    farm = Farm.objects.create(
        user=user,
        name="Cairo Demo Farm",
        location="Cairo, Egypt",
        soil_type="Loamy",
        climate_zone="Arid",
        latitude=30.0444,
        longitude=31.2357,
    )

    today = date.today()
    now = datetime.now()

    for pd in DEMO_PLOTS:
        sowing_date = today - timedelta(days=pd["days_old"])
        harvest_date = sowing_date + timedelta(days=pd["harvest_days"])

        plot = Plot.objects.create(
            farm=farm,
            name=pd["name"],
            crop_type=pd["crop_type"],
            area=pd["area"],
            moisture=pd["moisture"],
            harvest_date=harvest_date,
            status=pd["status"],
            latitude=pd["lat"],
            longitude=pd["lon"],
        )

        s = pd["soil"]
        SoilRecord.objects.create(
            plot=plot,
            nitrogen=s["nitrogen"],
            phosphorus=s["phosphorus"],
            potassium=s["potassium"],
            ph=s["ph"],
            moisture=s["moisture"],
        )

        IrrigationSchedule.objects.create(
            plot=plot,
            scheduled_time=now + timedelta(hours=random.randint(6, 30)),
            duration_minutes=random.randint(30, 90),
            water_volume=round(pd["area"] * random.uniform(4.0, 6.5), 1),
            status="scheduled",
        )

    # Also add as CropField entries (for My Farm map page)
    for pd in DEMO_PLOTS:
        CropField.objects.create(
            farm=farm,
            crop_type=pd["crop_type"].lower().split()[0],
            color=pd["color"],
            latitude=pd["lat"],
            longitude=pd["lon"],
            area=pd["area"],
            soil_type="Loamy",
            ndvi=round(random.uniform(0.55, 0.82), 3),
            soil_moisture=pd["moisture"],
            temperature=round(random.uniform(22.0, 30.0), 1),
            humidity=round(random.uniform(45.0, 70.0), 1),
        )


# ---------------------------------------------------------------------------
# Views
# ---------------------------------------------------------------------------


class FarmViewSet(viewsets.ModelViewSet):
    serializer_class = FarmSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Farm.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("!!! FarmSerializer validation errors:", serializer.errors)
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class PlotViewSet(viewsets.ModelViewSet):
    serializer_class = PlotSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Plot.objects.filter(farm__user=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("!!! PlotSerializer validation errors:", serializer.errors)
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        plot = serializer.save()
        import random
        from datetime import datetime, timedelta
        SoilRecord.objects.create(
            plot=plot,
            nitrogen=round(random.uniform(40, 80), 1),
            phosphorus=round(random.uniform(30, 60), 1),
            potassium=round(random.uniform(70, 110), 1),
            ph=round(random.uniform(6.5, 7.5), 1),
            moisture=plot.moisture or 50.0
        )
        IrrigationSchedule.objects.create(
            plot=plot,
            scheduled_time=datetime.now() + timedelta(days=1),
            duration_minutes=60,
            water_volume=plot.area * 5.0,
            status="scheduled"
        )


class IrrigationScheduleViewSet(viewsets.ModelViewSet):
    serializer_class = IrrigationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return IrrigationSchedule.objects.filter(plot__farm__user=self.request.user)


class DashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        farms_count = Farm.objects.filter(user=user).count()
        plots = Plot.objects.filter(farm__user=user)
        plots_count = plots.count()
        total_area = sum(p.area for p in plots) if plots_count > 0 else 0

        latest_irrigation = (
            IrrigationSchedule.objects
            .filter(plot__farm__user=user)
            .order_by("-scheduled_time")
            .first()
        )

        latest_soil = (
            SoilRecord.objects
            .filter(plot__farm__user=user)
            .order_by("-created_at")
            .first()
        )

        soc = 0.0
        oc = 0.0
        if latest_soil and latest_soil.plot:
            lat = float(latest_soil.plot.latitude) if latest_soil.plot.latitude else 30.0
            lon = float(latest_soil.plot.longitude) if latest_soil.plot.longitude else 31.0
            
            from django.db.models import ExpressionWrapper, FloatField
            from django.db.models import F as DBF
            from ai_core.models import CropField as AICropField
            
            try:
                nearest = AICropField.objects.annotate(
                    distance=ExpressionWrapper(
                        (DBF('lat') - lat) * (DBF('lat') - lat) + (DBF('lon') - lon) * (DBF('lon') - lon),
                        output_field=FloatField()
                    )
                ).order_by('distance').first()
                if nearest:
                    soc = nearest.soil_soc or 1.5
                    oc = nearest.soil_soc * 0.58 if nearest.soil_soc else 0.87
            except Exception:
                pass

        # Build crop lifecycle from newest/primary plot
        first_plot = plots.order_by("-id").first()
        crop_lifecycle = None
        if first_plot:
            today = date.today()
            sowing_date = first_plot.harvest_date - timedelta(days=120)  # approximate
            days_old = (today - sowing_date).days
            harvest_days = (first_plot.harvest_date - sowing_date).days
            days_remaining = (first_plot.harvest_date - today).days
            stage = _get_crop_stage(max(0, days_old), max(1, harvest_days))
            progress_pct = round(min(100, max(0, days_old / max(1, harvest_days) * 100)), 1)

            crop_lifecycle = {
                "crop_type": first_plot.crop_type,
                "plot_name": first_plot.name,
                "status": first_plot.status,
                "stage": stage,
                "days_growing": max(0, days_old),
                "total_days": max(1, harvest_days),
                "days_until_harvest": max(0, days_remaining),
                "progress_pct": progress_pct,
                "harvest_date": str(first_plot.harvest_date),
                "health_score": 87 if first_plot.status == "healthy" else 62,
            }

        return Response({
            "farms_count": farms_count,
            "plots_count": plots_count,
            "total_area": round(total_area, 2),
            "latest_irrigation": {
                "id": latest_irrigation.id,
                "status": latest_irrigation.status,
                "scheduled_time": latest_irrigation.scheduled_time,
                "duration_minutes": latest_irrigation.duration_minutes,
                "water_volume": latest_irrigation.water_volume,
            } if latest_irrigation else None,
            "latest_soil_record": {
                "id": latest_soil.id,
                "nitrogen": latest_soil.nitrogen,
                "phosphorus": latest_soil.phosphorus,
                "potassium": latest_soil.potassium,
                "ph": latest_soil.ph,
                "moisture": latest_soil.moisture,
                "soc": round(soc, 2),
                "oc": round(oc, 2),
            } if latest_soil else None,
            "crop_lifecycle": crop_lifecycle,
        })


class CropFieldViewSet(viewsets.ModelViewSet):
    """ViewSet for CropField with filtering and map capabilities."""

    serializer_class = CropFieldSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['crop_type', 'farm', 'soil_type']
    search_fields = ['crop_type', 'soil_type']

    def get_queryset(self):
        """Return crop fields for user's farms only."""
        user = self.request.user
        return CropField.objects.filter(farm__user=user).select_related('farm')

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def geojson(self, request):
        """Return crop fields as GeoJSON for map visualization."""
        user = request.user
        crop_type = request.query_params.get('crop_type', None)

        queryset = CropField.objects.filter(farm__user=user)
        if crop_type:
            queryset = queryset.filter(crop_type=crop_type)

        features = []
        for field in queryset:
            features.append({
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': [float(field.longitude), float(field.latitude)]
                },
                'properties': {
                    'id': field.id,
                    'crop_type': field.crop_type,
                    'color': field.color,
                    'area': field.area,
                    'soil_type': field.soil_type,
                    'ndvi': field.ndvi,
                    'soil_moisture': field.soil_moisture,
                    'temperature': field.temperature,
                    'humidity': field.humidity,
                    'farm_id': field.farm_id,
                    'farm_name': field.farm.name if field.farm else None,
                }
            })

        return Response({
            'type': 'FeatureCollection',
            'features': features
        })

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def statistics(self, request):
        """Return crop field statistics for the user."""
        user = self.request.user
        fields = CropField.objects.filter(farm__user=user)

        stats = {
            'total_fields': fields.count(),
            'total_area': sum(f.area for f in fields) if fields.exists() else 0,
            'crop_distribution': {},
            'average_ndvi': None,
            'average_moisture': None,
        }

        # Crop distribution
        for crop_type, _ in CropField._meta.get_field('crop_type').choices:
            count = fields.filter(crop_type=crop_type).count()
            if count > 0:
                stats['crop_distribution'][crop_type] = count

        # Average metrics
        fields_with_ndvi = fields.filter(ndvi__isnull=False)
        if fields_with_ndvi.exists():
            avg_ndvi = sum(f.ndvi for f in fields_with_ndvi) / fields_with_ndvi.count()
            stats['average_ndvi'] = round(avg_ndvi, 3)

        fields_with_moisture = fields.filter(soil_moisture__isnull=False)
        if fields_with_moisture.exists():
            avg_moisture = sum(f.soil_moisture for f in fields_with_moisture) / fields_with_moisture.count()
            stats['average_moisture'] = round(avg_moisture, 2)

        return Response(stats)


class PublicStatsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        users_count = User.objects.count()
        farms_count = Farm.objects.count()
        crops_count = CropField.objects.values('crop_type').distinct().count()

        return Response({
            "active_farmers": users_count + 5000, # Base + real count
            "accuracy_rate": 95,
            "monitored_crops": crops_count + 50,
            "water_saved": 30
        })


class TestimonialViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.AllowAny]
    from .models import Testimonial
    from .serializers import TestimonialSerializer
    queryset = Testimonial.objects.filter(is_active=True).order_by('-rating', '-created_at')
    serializer_class = TestimonialSerializer


class FarmHistoryViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    from .models import FarmHistory
    from .serializers import FarmHistorySerializer
    serializer_class = FarmHistorySerializer

    def get_queryset(self):
        from .models import FarmHistory
        return FarmHistory.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ContactMessageView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from ai_core.models import ContactMessage
        name = request.data.get("name")
        email = request.data.get("email")
        message = request.data.get("message")
        
        if not name or not email or not message:
            return Response({"error": "All fields are required"}, status=400)
            
        ContactMessage.objects.create(name=name, email=email, message=message)
        return Response({"message": "Contact message sent successfully"}, status=201)
