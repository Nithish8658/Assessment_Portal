@echo off
title Assessment Portal - Service Status
echo ========================================================
echo   Checking Assessment Portal Autonomous Services
echo ========================================================
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ^
    "$tasks = Get-ScheduledTask | Where-Object { $_.TaskName -in 'AssessmentPortalBackend', 'AssessmentPortalFrontend' } | Select-Object TaskName, State; " ^
    "$ports = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -in 5173, 8001 } | Select-Object LocalPort, OwningProcess; " ^
    "Write-Host '--- Scheduled Tasks ---' -ForegroundColor Cyan; $tasks | Format-Table; " ^
    "Write-Host '--- Active Ports ---' -ForegroundColor Cyan; $ports | Format-Table; " ^
    "try { $fe = Invoke-WebRequest -Uri 'http://localhost:5173' -UseBasicParsing -TimeoutSec 5; Write-Host 'Frontend (5173): ONLINE' -ForegroundColor Green } catch { Write-Host 'Frontend (5173): OFFLINE' -ForegroundColor Red }; " ^
    "try { $be = Invoke-WebRequest -Uri 'http://localhost:8001/docs' -UseBasicParsing -TimeoutSec 5; Write-Host 'Backend (8001): ONLINE' -ForegroundColor Green } catch { Write-Host 'Backend (8001): OFFLINE' -ForegroundColor Red }"
echo.
pause
