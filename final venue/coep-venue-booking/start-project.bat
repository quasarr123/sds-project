@echo off
setlocal
cd /d "%~dp0"
where bun >nul 2>nul
if errorlevel 1 (
  echo ERROR: Bun is not installed or not on PATH. Install it from https://bun.sh
  pause
  exit /b 1
)
echo Web app:    http://localhost:3000
echo API health: http://localhost:3001/api/health
echo Keep this window open while using the app.
call bun run dev
pause
