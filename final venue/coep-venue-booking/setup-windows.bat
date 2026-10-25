@echo off
setlocal
cd /d "%~dp0"
where bun >nul 2>nul
if errorlevel 1 (
  echo ERROR: Bun is not installed or not on PATH. Install it from https://bun.sh
  pause
  exit /b 1
)
echo [1/2] Installing dependencies...
call bun install
if errorlevel 1 (
  echo ERROR: Dependency installation failed.
  pause
  exit /b 1
)
echo.
echo Check backend\.env (copy backend\.env.example if it does not exist) before continuing.
choice /M "Create tables and demo data in the database now"
if errorlevel 2 goto done
call bun run db:init
if errorlevel 1 (
  echo ERROR: Database setup failed. Check backend\.env and that the database is reachable.
  pause
  exit /b 1
)
:done
echo.
echo Setup complete. Next: double-click start-project.bat
pause
