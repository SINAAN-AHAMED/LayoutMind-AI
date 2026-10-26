@echo off
setlocal
cd /d "%~dp0"
echo Preparing LayoutMind Desktop...
where py >nul 2>&1
if errorlevel 1 (python start.py --setup-only) else (py -3 start.py --setup-only)
if errorlevel 1 goto failed
set "LAYOUTMIND_PYTHON=%~dp0.venv\Scripts\python.exe"
where node >nul 2>&1
if errorlevel 1 goto failed
pushd frontend
call npm ci
if errorlevel 1 goto failed
call npm run build
if errorlevel 1 goto failed
popd
pushd electron
call npm ci
if errorlevel 1 goto failed
call npm start
if errorlevel 1 goto failed
popd
exit /b 0
:failed
echo Setup failed. See the error above. Python 3.12 and Node.js 22.12+ are recommended.
pause
exit /b 1
