from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import (
    FarmViewSet, DashboardView, CropFieldViewSet, PlotViewSet, 
    IrrigationScheduleViewSet, PublicStatsView, TestimonialViewSet, 
    FarmHistoryViewSet, ContactMessageView
)

router = DefaultRouter()
router.register(r"farms", FarmViewSet, basename="farms")
router.register(r"fields", CropFieldViewSet, basename="crop-fields")
router.register(r"plots", PlotViewSet, basename="plots")
router.register(r"schedules", IrrigationScheduleViewSet, basename="irrigation-schedules")
router.register(r"testimonials", TestimonialViewSet, basename="testimonials")
router.register(r"history", FarmHistoryViewSet, basename="history")

urlpatterns = router.urls + [
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
    path("public/stats/", PublicStatsView.as_view(), name="public-stats"),
    path("public/contact/", ContactMessageView.as_view(), name="public-contact"),
]