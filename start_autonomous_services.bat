@echo off
title Start Assessment Portal Services
echo ========================================================
echo   Starting Autonomous Assessment Portal Services
echo ========================================================
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ^
    "Start-ScheduledTask -TaskName 'AssessmentPortalBackend' -ErrorAction SilentlyContinue; " ^
    "Start-ScheduledTask -TaskName 'AssessmentPortalFrontend' -ErrorAction SilentlyContinue; " ^
    "Start-Sleep -Seconds 2; " ^
    "$tasks = Get-ScheduledTask | Where-Object { $_.TaskName -in 'AssessmentPortalBackend', 'AssessmentPortalFrontend' } | Select-Object TaskName, State; " ^
    "$tasks | Format-Table; " ^
    "Write-Host 'Services started successfully in the background!' -ForegroundColor Green"
echo.
pause
