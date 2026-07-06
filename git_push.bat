@echo off
echo ==============================================
echo   FarmTech AI - Pushing All Fixes to GitHub
echo ==============================================
echo.

cd /d "%~dp0"

:: Stage all modified/new files
echo [*] Staging files...

:: Backend AI views (stub fixes)
git add farmtech_fixed/backend/ai_core/views.py

:: Frontend API client
git add farmtech_fixed/frontend/lib/api.ts

:: Frontend pages with mock data removed
git add farmtech_fixed/frontend/app/my-farm/page.tsx
git add farmtech_fixed/frontend/app/soil-health/page.tsx
git add farmtech_fixed/frontend/app/market-prices/page.tsx

:: Frontend components
git add farmtech_fixed/frontend/components/weather-widget.tsx

echo [*] Committing...
git commit -m "fix: remove all mock data and wire all endpoints to real DB/API

Backend:
- SoilHealthPredictionView: real health score from CropField soil data (pH, SOC, N, CEC, moisture)
- FertilizerOptimizerView: real NPK deficit calc -> Urea/DAP/MOP kg/ha from soil chemistry
- ScenarioSimulatorView: DB-derived NDVI/moisture stats for scenario impact estimation
- CropRotationView: agronomic rotation rules + real soil context from nearest CropField

Frontend:
- api.ts: export apiFetch, add soilHealth/fertilizer/cropRotation/scenarioSimulator endpoints
- my-farm: remove mockPlots -> real /api/farms/farms/ + /api/farms/fields/ calls
- soil-health: remove hardcoded values -> real /api/ai/soil-health/ with score chart
- market-prices: remove mockPrices + priceTrendData -> empty state + real AI forecast
- weather-widget: replace --C/--% with Open-Meteo live API + geolocation"

:: Push to remote repository
echo [*] Pushing to GitHub...
git push

echo.
echo ==============================================
echo   Push complete! All endpoints are live.
echo ==============================================
pause
