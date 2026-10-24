@echo off
setlocal
cd /d "%~dp0"
echo ============================================
echo COEP Venue Booking System - Windows Setup
echo ============================================
where bun >nul 2>nul
if errorlevel 1 (
  echo ERROR: Bun is not installed or not on PATH.
  echo Install Bun from https://bun.sh and reopen this terminal.
  pause
  exit /b 1
)
echo.
echo [1/2] Installing project dependencies...
call bun install
if errorlevel 1 (
  echo ERROR: Dependency installation failed.
  pause
  exit /b 1
)
echo.
echo Before creating the database, ensure MySQL is installed and its service is running.
echo Check .env and set DB_USER and DB_PASSWORD to your local MySQL credentials.
echo Current database name in .env: venue_booking
echo.
choice /M "Initialize database and insert demo data now"
if errorlevel 2 goto done
call bun run db:init
if errorlevel 1 (
  echo.
  echo ERROR: Database initialization failed.
  echo Check that MySQL is running and .env credentials are correct.
  pause
  exit /b 1
)
:done
echo.
echo Setup step complete.
echo Next: double-click start-project.bat
pause
