@echo off
TITLE FarmTech Smart Farming Platform
SETLOCAL ENABLEDELAYEDEXPANSION
SET "ROOT_DIR=%~dp0"

echo ==========================================
echo    FarmTech Smart Farming Platform
echo    Starting all services...
echo ==========================================
echo.

REM --- Find Python venv ---
SET "VENV_PYTHON="
IF EXIST "%ROOT_DIR%.venv\Scripts\python.exe"         SET "VENV_PYTHON=%ROOT_DIR%.venv\Scripts\python.exe"
IF EXIST "%ROOT_DIR%..\.venv\Scripts\python.exe"       SET "VENV_PYTHON=%ROOT_DIR%..\.venv\Scripts\python.exe"
IF EXIST "%ROOT_DIR%venv\Scripts\python.exe"           SET "VENV_PYTHON=%ROOT_DIR%venv\Scripts\python.exe"
IF EXIST "%ROOT_DIR%backend\.venv\Scripts\python.exe"  SET "VENV_PYTHON=%ROOT_DIR%backend\.venv\Scripts\python.exe"

IF "!VENV_PYTHON!"=="" (
    WHERE python >nul 2>&1
    IF !ERRORLEVEL! == 0 (
        SET "VENV_PYTHON=python"
        echo [!] Using system Python
    ) ELSE (
        echo [ERROR] Python not found. Please install Python 3.10+ or create a virtual environment.
        pause
        exit /b 1
    )
) ELSE (
    echo [!] Python found: !VENV_PYTHON!
)

REM --- Install missing Python packages ---
SET "BACKEND_DIR=%ROOT_DIR%backend"

echo [!] Checking Python packages (whitenoise, requests, django-filter, dj-database-url)...
"!VENV_PYTHON!" -c "import whitenoise" >nul 2>&1
IF !ERRORLEVEL! NEQ 0 (
    echo [!] Installing whitenoise...
    "!VENV_PYTHON!" -m pip install whitenoise --quiet
)
"!VENV_PYTHON!" -c "import requests" >nul 2>&1
IF !ERRORLEVEL! NEQ 0 (
    echo [!] Installing requests...
    "!VENV_PYTHON!" -m pip install requests --quiet
)
"!VENV_PYTHON!" -c "import django_filters" >nul 2>&1
IF !ERRORLEVEL! NEQ 0 (
    echo [!] Installing django-filter...
    "!VENV_PYTHON!" -m pip install django-filter --quiet
)
"!VENV_PYTHON!" -c "import dj_database_url" >nul 2>&1
IF !ERRORLEVEL! NEQ 0 (
    echo [!] Installing dj-database-url...
    "!VENV_PYTHON!" -m pip install dj-database-url --quiet
)

REM --- Force SQLite (override PostgreSQL env from .env) ---
SET "DB_ENGINE=sqlite3"
SET "DATABASE_URL="

REM --- Apply migrations ---
echo [!] Running database migrations...
cd /d "%BACKEND_DIR%"
"!VENV_PYTHON!" manage.py migrate --run-syncdb 2>&1 | findstr /V "^Applying" | findstr /V "OK"
echo [!] Migrations done.

echo [!] Checking crop fields database...
"!VENV_PYTHON!" manage.py shell -c "from ai_core.models import CropField; import sys; sys.exit(0 if CropField.objects.exists() else 1)"
IF !ERRORLEVEL! NEQ 0 (
    echo [!] Seeding 64,100 dynamic records into CropField database...
    "!VENV_PYTHON!" manage.py import_cropfields --mock
) ELSE (
    echo [!] CropField database already populated.
)

REM --- Start Django Backend ---
echo [!] Starting Django Backend on http://127.0.0.1:8001 ...
start "FarmTech Backend" cmd /k "cd /d "%BACKEND_DIR%" && SET DB_ENGINE=sqlite3 && SET DATABASE_URL= && "!VENV_PYTHON!" manage.py runserver 8001"

echo [!] Waiting for backend to start (5s)...
timeout /t 5 /nobreak > nul

REM --- Frontend setup ---
SET "FRONTEND_DIR=%ROOT_DIR%frontend"

REM Write correct API URL
echo NEXT_PUBLIC_API_URL=http://127.0.0.1:8001 > "%FRONTEND_DIR%\.env.local"

REM Install node_modules if missing
IF NOT EXIST "%FRONTEND_DIR%\node_modules" (
    echo [!] Installing frontend dependencies (first run - this takes a minute)...
    cmd /c "cd /d "%FRONTEND_DIR%" && npm install"
)

REM Install jest packages if missing
IF NOT EXIST "%FRONTEND_DIR%\node_modules\jest" (
    echo [!] Installing jest for testing...
    cmd /c "cd /d "%FRONTEND_DIR%" && npm install --save-dev jest @types/jest ts-jest jest-environment-jsdom --quiet"
)

REM --- Start Next.js Frontend ---
echo [!] Starting Next.js Frontend on http://localhost:3000 ...
start "FarmTech Frontend" cmd /k "cd /d "%FRONTEND_DIR%" && npm run dev"

echo.
echo ==========================================
echo    All services are starting!
echo.
echo    Backend API:  http://127.0.0.1:8001
echo    Frontend:     http://localhost:3000
echo    API Docs:     http://127.0.0.1:8001/swagger/
echo.
echo    Two windows opened for backend + frontend.
echo    Close BOTH windows to stop all services.
echo ==========================================
echo.

timeout /t 8 /nobreak > nul
start "" "http://localhost:3000"

echo [!] Browser opened. Close this window when done.
pause > nul
