@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>&1
if errorlevel 1 (python start.py --setup-only) else (py -3 start.py --setup-only)
if errorlevel 1 goto failed
"%~dp0.venv\Scripts\python.exe" -m uvicorn main_fixed:app --app-dir softcomputing-service --host 127.0.0.1 --port 8000 --reload
if errorlevel 1 goto failed
exit /b 0
:failed
echo Engine could not start. Check the error above; no existing processes were terminated.
pause
exit /b 1
