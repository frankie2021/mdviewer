@echo off
setlocal
cd /d "%~dp0"

title folio - markdown viewer

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found on PATH.
  echo Install it from https://nodejs.org and run this file again.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo.
    echo npm install failed. Scroll up for the error.
    pause
    exit /b 1
  )
)

echo.
echo Starting folio at http://localhost:5173
echo Close this window or press Ctrl+C to stop.
echo.

call npm run dev -- --open

pause
