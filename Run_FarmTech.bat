@echo off
SETLOCAL EnableDelayedExpansion
TITLE FarmTech AI - Unified Runner

echo ===================================================
echo           FarmTech AI - Starting Project
echo ===================================================
echo.

:: Set paths
SET ROOT_DIR=%~dp0
SET BACKEND_DIR=%ROOT_DIR%farmtech_fixed\backend
SET FRONTEND_DIR=%ROOT_DIR%farmtech_fixed\frontend
SET VENV_PYTHON=%ROOT_DIR%.venv\Scripts\python.exe

:: 1. Check for VENV
if not exist "%VENV_PYTHON%" (
    echo [ERROR] Virtual environment not found at %VENV_PYTHON%
    echo Please ensure the .venv folder exists in the root directory.
    pause
    exit /b 1
)

:: 1.5 Sync Backend Requirements
echo [0/4] Checking backend requirements...
"%VENV_PYTHON%" -m pip install -r "%BACKEND_DIR%\requirements.txt" --quiet
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Backend requirements sync failed. Check your internet connection.
)

:: 2. Check Frontend Dependencies
if not exist "%FRONTEND_DIR%\node_modules\react-leaflet" (
    echo [1/4] Installing frontend dependencies...
    pushd "%FRONTEND_DIR%"
    call npm.cmd install --legacy-peer-deps
    popd
) else (
    echo [1/4] Frontend dependencies found.
)

:: 3. Pre-warm RAG (Disabled)
echo [2/4] RAG pre-warm skipped (disabled)...
echo.

:: 4. Seeding check
echo [2.5/4] Checking crop fields database...
"%VENV_PYTHON%" -c "from django.core.management import call_command; import django; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings'); django.setup(); from ai_core.models import CropField; import sys; sys.exit(0 if CropField.objects.exists() else 1)" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Seeding 64,100 dynamic records into CropField database...
    "%VENV_PYTHON%" "%BACKEND_DIR%\manage.py" import_cropfields --mock
) else (
    echo CropField database already populated.
)
echo.

:: 4. Launch Backend and Frontend
echo [3/4] Launching Backend and Frontend...
echo Press Ctrl+C to stop both servers.
echo.

:: Start Backend in background
start "FarmTech Backend" /d "%BACKEND_DIR%" cmd /c "%VENV_PYTHON% manage.py runserver 8001"

:: Start Frontend in background
start "FarmTech Frontend" /d "%FRONTEND_DIR%" cmd /c "npm.cmd run dev"

:: 5. Open Browser
echo [4/4] Opening browser in 15 seconds...
echo Waiting for servers to initialize...
timeout /t 15 /nobreak > nul
start http://localhost:3000

echo.
echo ===================================================
echo FarmTech AI is now running!
echo Backend: http://localhost:8001
echo Frontend: http://localhost:3000
echo ===================================================
echo.
echo If the browser shows "Refused to connect", please wait 
echo a few more seconds and refresh the page.
echo.
pause
