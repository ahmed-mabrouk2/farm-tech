@echo off
TITLE FarmTech Unified Launcher
SET ROOT_DIR=%~dp0

echo ==========================================
echo    FarmTech Smart Farming Platform
echo ==========================================
echo.

SET VENV_PYTHON=%ROOT_DIR%..\.venv\Scripts\python.exe

:: 1. Start Backend in the background of the SAME window
echo [*] Starting Django Backend...
start /b cmd /c "cd /d %ROOT_DIR%backend && "%VENV_PYTHON%" manage.py runserver 8001"

:: 2. Wait a few seconds
timeout /t 5 /nobreak > nul

:: 3. Start Frontend in the background of the SAME window
echo [*] Starting Next.js Frontend...
start /b cmd /c "cd /d %ROOT_DIR%frontend && npm run dev"

echo.
echo ==========================================
echo    All services are running in this window!
echo    Backend:  http://127.0.0.1:8001
echo    Frontend: http://localhost:3000
echo    (Press Ctrl+C to stop everything)
echo ==========================================

:: Keep the window open to see the logs
pause > nul
