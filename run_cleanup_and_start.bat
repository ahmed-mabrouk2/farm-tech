@echo off
TITLE FarmTech AI - Server Cleanup and Reset
echo ===================================================
echo     Shutting down all running servers...
echo ===================================================
echo.

:: 1. Forcefully kill any running Python (Django) and Node (Next.js) processes
taskkill /F /IM python.exe 2>nul
taskkill /F /IM node.exe 2>nul

echo.
echo ===================================================
echo     Installing Frontend Dependencies...
echo ===================================================
echo.

:: 2. Install dependencies with legacy peer deps flags
pushd "%~dp0farmtech_fixed\frontend"
call npm.cmd install --legacy-peer-deps
popd

echo.
echo ===================================================
echo     Starting Unified FarmTech Project...
echo ===================================================
echo.

:: 3. Run the launch script
call "%~dp0Run_FarmTech.bat"

pause
