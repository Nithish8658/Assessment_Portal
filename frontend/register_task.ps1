# =====================================================================
# 1-Click Task Scheduler Registrar for Assessment Portal Frontend
# =====================================================================
$FrontendDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$TaskName = "AssessmentPortalFrontend"
$ScriptPath = Join-Path $FrontendDir "start_frontend_watchdog.ps1"

Write-Host "Creating Scheduled Task: $TaskName..." -ForegroundColor Cyan

$Action = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$ScriptPath`"" `
    -WorkingDirectory $FrontendDir

$Trigger = New-ScheduledTaskTrigger -AtLogOn

$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1)

try {
    Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Force
    Write-Host "SUCCESS: Task '$TaskName' registered successfully!" -ForegroundColor Green
    Write-Host "Starting task now..." -ForegroundColor Cyan
    Start-ScheduledTask -TaskName $TaskName
    Write-Host "Frontend is now running in the background!" -ForegroundColor Green
} catch {
    Write-Host "Error creating task: $_" -ForegroundColor Red
}
