@echo off
title LayoutMind — AI Engine
color 0A

REM Resolve Python (.venv first)
if exist "%~dp0.venv\Scripts\python.exe" (
  set PY_BIN=%~dp0.venv\Scripts\python.exe
) else (
  set PY_BIN=python
)

REM Kill anything already on port 8000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000 " 2^>nul') do (
  echo Killing stale process %%a on port 8000...
  taskkill /PID %%a /F >nul 2>&1
)

echo Starting LayoutMind AI Engine on http://127.0.0.1:8000 ...
echo Press Ctrl+C to stop.
echo.

cd /d "%~dp0softcomputing-service"
"%PY_BIN%" -m uvicorn main_fixed:app --host 127.0.0.1 --port 8000 --reload --log-level info
