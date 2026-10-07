@echo off
title Assessment Portal Frontend Supervisor
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start_frontend_watchdog.ps1"
pause
