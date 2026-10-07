# =====================================================================
# Assessment Portal - Robust Frontend Watchdog & Auto-Supervisor
# =====================================================================
# - Uses direct Node.js execution on Vite (no fragile cmd.exe wrappers)
# - Immune to stdin disconnects / EOF crashes
# - Auto-restarts infinitely on unexpected exit
# - Logs startup and exit codes to frontend_supervisor.log
# =====================================================================

$FrontendDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location -Path $FrontendDir

$LogFile = Join-Path $FrontendDir "frontend_supervisor.log"

function Log-Message {
    param([string]$Message, [string]$Color = "White")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $Formatted = "[$Timestamp] $Message"
    if ($Host.UI.RawUI -ne $null) {
        Write-Host $Formatted -ForegroundColor $Color
    }
    Add-Content -Path $LogFile -Value $Formatted -ErrorAction SilentlyContinue
}

Log-Message "==========================================================" "Cyan"
Log-Message "  NASC Assessment Portal - Robust Frontend Watchdog      " "White"
Log-Message "==========================================================" "Cyan"

$NodePath = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $NodePath) {
    $NodePath = "C:\Program Files\nodejs\node.exe"
}
Log-Message "[INIT] Node runtime: $NodePath" "Green"

$ViteScript = Join-Path $FrontendDir "node_modules\vite\bin\vite.js"
if (-not (Test-Path $ViteScript)) {
    Log-Message "[CRITICAL] vite.js not found at: $ViteScript" "Red"
    exit 1
}

$RestartCount = 0

while ($true) {
    $RestartCount++
    Log-Message ">>> Launching Vite (node vite.js --host 0.0.0.0 --port 5173) [Run #$RestartCount]..." "Green"
    
    try {
        # Start node directly with Vite script, disconnected from stdin
        $proc = Start-Process -FilePath $NodePath `
            -ArgumentList @("`"$ViteScript`"", "--host", "0.0.0.0", "--port", "5173") `
            -WorkingDirectory $FrontendDir `
            -NoNewWindow `
            -PassThru
            
        # Wait for the process to exit
        $proc.WaitForExit()
        $ExitCode = $proc.ExitCode
    } catch {
        Log-Message "[ERROR] Failed to start frontend process: $_" "Red"
        $ExitCode = 1
    }

    Log-Message "[WARN] Frontend exited (Exit Code: $ExitCode). Auto-restarting in 2 seconds..." "Yellow"
    Start-Sleep -Seconds 2
}
