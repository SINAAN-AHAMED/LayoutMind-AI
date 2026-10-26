@echo off
setlocal
cd /d "%~dp0"
pushd frontend
call npm ci
if errorlevel 1 goto failed
call npm run build
if errorlevel 1 goto failed
popd
pushd electron
call npm ci
if errorlevel 1 goto failed
call npm run dist
if errorlevel 1 goto failed
popd
echo Installer output: electron\dist
pause
exit /b 0
:failed
echo Build failed. See the error above.
pause
exit /b 1
