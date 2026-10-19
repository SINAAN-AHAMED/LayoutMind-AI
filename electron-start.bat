@echo off
title LayoutMind — Development Launcher
color 0B
echo.
echo  ██╗      █████╗ ██╗   ██╗ ██████╗ ██╗   ██╗████████╗███╗   ███╗██╗███╗   ██╗██████╗
echo  ██║     ██╔══██╗╚██╗ ██╔╝██╔═══██╗██║   ██║╚══██╔══╝████╗ ████║██║████╗  ██║██╔══██╗
echo  ██║     ███████║ ╚████╔╝ ██║   ██║██║   ██║   ██║   ██╔████╔██║██║██╔██╗ ██║██║  ██║
echo  ██║     ██╔══██║  ╚██╔╝  ██║   ██║██║   ██║   ██║   ██║╚██╔╝██║██║██║╚██╗██║██║  ██║
echo  ███████╗██║  ██║   ██║    ╚██████╔╝╚██████╔╝   ██║   ██║ ╚═╝ ██║██║██║ ╚████║██████╔╝
echo  ╚══════╝╚═╝  ╚═╝   ╚═╝    ╚═════╝  ╚═════╝    ╚═╝   ╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═════╝
echo.
echo  AI Interior Layout Studio — Desktop Launcher
echo  ============================================
echo.

REM ── 1. Resolve Python binary (.venv first, then system) ──────────────────────
if exist ".venv\Scripts\python.exe" (
  set PY_BIN=.venv\Scripts\python.exe
  echo  [OK] Using virtualenv Python: .venv\Scripts\python.exe
  goto py_ok
)

py --version >nul 2>&1
if %errorlevel% equ 0 (
  set PY_BIN=py
  echo  [OK] Python found: py
  goto py_ok
)

python --version >nul 2>&1
if %errorlevel% equ 0 (
  set PY_BIN=python
  echo  [OK] Python found: python
  goto py_ok
)

echo  [ERROR] Python not found. Please install Python 3.10+ from https://python.org
pause
exit /b 1

:py_ok

REM ── 2. Install Python dependencies if needed ─────────────────────────────────
echo  [..] Checking Python dependencies...
%PY_BIN% -c "import fastapi, uvicorn, numpy, skfuzzy, deap, spacy" >nul 2>&1
if %errorlevel% equ 0 goto check_node

echo  [..] Installing Python packages (first run only)...
%PY_BIN% -m pip install -r softcomputing-service\requirements.txt
if %errorlevel% neq 0 (
  echo  [WARN] Some packages may not have installed. Continuing...
)

:check_node
REM ── 3. Check Node.js ─────────────────────────────────────────────────────────
node --version >nul 2>&1
if %errorlevel% neq 0 (
  echo  [ERROR] Node.js not found. Please install Node.js from https://nodejs.org
  pause
  exit /b 1
)
echo  [OK] Node.js found

REM ── 4. Install Electron dependencies if needed ────────────────────────────────
if not exist "electron\node_modules" (
  echo  [..] Installing Electron dependencies...
  cd electron && npm install && cd ..
)

REM ── 5. Always rebuild frontend to pick up latest changes ─────────────────────
echo  [..] Building React frontend (always fresh)...
cd frontend
call npm run build
if %errorlevel% neq 0 (
  echo  [ERROR] Frontend build failed. Check errors above.
  cd ..
  pause
  exit /b 1
)
cd ..

REM ── 6. Kill any stale Python backend on port 8000 ────────────────────────────
echo  [..] Checking for stale backend on port 8000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000 " 2^>nul') do (
  echo  [..] Killing stale process %%a on port 8000...
  taskkill /PID %%a /F >nul 2>&1
)

REM ── 7. Start Python FastAPI backend in background ─────────────────────────────
echo  [..] Starting Python AI engine on port 8000...
start "LayoutMind — AI Engine" /min %PY_BIN% -m uvicorn main_fixed:app --host 127.0.0.1 --port 8000 --log-level warning
REM   ^ Note: uvicorn needs cwd=softcomputing-service for the module import.
REM   We change into that directory inside the started window via pushd below.
REM   Since `start` doesn't support chained cwd changes, we use a helper script.

REM   Kill the /min window we just opened and redo it properly with the right cwd:
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000 " 2^>nul') do (
  taskkill /PID %%a /F >nul 2>&1
)
start "LayoutMind — AI Engine" /min cmd /c "cd /d "%~dp0softcomputing-service" && "%~dp0%PY_BIN%" -m uvicorn main_fixed:app --host 127.0.0.1 --port 8000 --log-level warning"

REM Give the engine a moment to bind the port
timeout /t 3 /nobreak >nul

REM ── 8. Wait for AI engine health check ────────────────────────────────────────
echo  [..] Waiting for AI engine to become ready...
set RETRIES=0
:wait_loop
%PY_BIN% -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=2)" >nul 2>&1
if %errorlevel% equ 0 goto backend_ready
set /a RETRIES+=1
if %RETRIES% geq 20 (
  echo  [WARN] AI engine not responding after 20 attempts — launching app anyway.
  goto launch
)
timeout /t 1 /nobreak >nul
goto wait_loop

:backend_ready
echo  [OK] AI engine is ready on http://127.0.0.1:8000

:launch
echo.
echo  [OK] All checks passed. Launching LayoutMind...
echo.

REM ── 9. Launch Electron (Electron will also manage Python in packaged builds) ──
cd electron && npx electron .
