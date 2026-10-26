@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>&1
if errorlevel 1 (python start.py) else (py -3 start.py)
if errorlevel 1 pause
