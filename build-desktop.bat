@echo off
title LayoutMind — Build Desktop Installer
color 0A
echo.
echo  Building LayoutMind Desktop Installer (.exe)
echo  =============================================
echo.

REM ── 1. Build React frontend ───────────────────────────────────────────────────
echo  [1/3] Building React frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
  echo  [ERROR] Frontend build failed. Check errors above.
  cd ..
  pause
  exit /b 1
)
cd ..
echo  [OK] Frontend built successfully.
echo.

REM ── 2. Install Electron dependencies ─────────────────────────────────────────
echo  [2/3] Installing Electron dependencies...
cd electron
call npm install
if %errorlevel% neq 0 (
  echo  [ERROR] npm install failed.
  cd ..
  pause
  exit /b 1
)
echo  [OK] Dependencies installed.
echo.

REM ── 3. Build the installer ────────────────────────────────────────────────────
echo  [3/3] Packaging Windows installer (this may take 2-5 minutes)...
call npm run dist
if %errorlevel% neq 0 (
  echo  [ERROR] electron-builder failed.
  cd ..
  pause
  exit /b 1
)
cd ..

echo.
echo  ============================================
echo  SUCCESS! Installer is in: electron\dist\
echo  ============================================
echo.
start "" "electron\dist"
pause
