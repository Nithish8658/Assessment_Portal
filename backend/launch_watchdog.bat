@echo off
title Assessment Portal Backend Supervisor
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start_backend_watchdog.ps1"
pause
