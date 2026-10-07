# =====================================================================
# Auto-Start Installer for Assessment Portal Backend
# =====================================================================
# Runs this script in PowerShell to add the watchdog directly to
# the Windows Startup folder (shell:startup)
# =====================================================================

$BackendDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$TargetBat = "$BackendDir\launch_watchdog.bat"
$StartupFolder = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Startup)
$ShortcutPath = Join-Path $StartupFolder "Assessment_Portal_Backend.lnk"

Write-Host "Registering Backend Supervisor into Windows Startup folder..." -ForegroundColor Cyan

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $TargetBat
$Shortcut.WorkingDirectory = $BackendDir
$Shortcut.Description = "Auto-start watchdog for Assessment Portal Backend"
$Shortcut.Save()

Write-Host "SUCCESS! Shortcut created at:" -ForegroundColor Green
Write-Host "  $ShortcutPath" -ForegroundColor Yellow
Write-Host ""
Write-Host "Whenever you log into Windows, this supervisor window will automatically launch and keep your backend alive." -ForegroundColor White
