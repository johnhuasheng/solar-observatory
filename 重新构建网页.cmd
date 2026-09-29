@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22.13 or newer is required to rebuild this website.
  pause
  exit /b 1
)
if not exist "node_modules\vite\bin\vite.js" (
  echo Installing build dependencies for the first time...
  call npm install --no-audit --no-fund
  if errorlevel 1 goto :failed
)
call npm run build
if errorlevel 1 goto :failed
echo Build complete. Refresh the browser or run the launcher again.
pause
exit /b 0
:failed
echo Build failed. The previous website remains available.
pause
exit /b 1
