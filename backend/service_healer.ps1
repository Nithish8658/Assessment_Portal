# =====================================================================
# Assessment Portal - Self-Healing Background Service Watchdog
# =====================================================================
# Runs silently and monitors port 5173 (Frontend) and 8001 (Backend).
# If either service is down or stopped, it revives it immediately.
# =====================================================================

$ErrorActionPreference = "SilentlyContinue"

function Test-HttpEndpoint {
    param([string]$Url, [int]$TimeoutSec = 3)
    try {
        $req = [System.Net.WebRequest]::Create($Url)
        $req.Timeout = $TimeoutSec * 1000
        $resp = $req.GetResponse()
        $resp.Close()
        return $true
    } catch {
        return $false
    }
}

while ($true) {
    # 1. Check Backend (Port 8001)
    $backendAlive = Test-HttpEndpoint "http://127.0.0.1:8001/"
    if (-not $backendAlive) {
        $bTask = Get-ScheduledTask -TaskName "AssessmentPortalBackend" -ErrorAction SilentlyContinue
        if ($bTask -and $bTask.State -ne "Running") {
            Start-ScheduledTask -TaskName "AssessmentPortalBackend"
        }
    }

    # 2. Check Frontend (Port 5173)
    $frontendAlive = Test-HttpEndpoint "http://127.0.0.1:5173/"
    if (-not $frontendAlive) {
        $fTask = Get-ScheduledTask -TaskName "AssessmentPortalFrontend" -ErrorAction SilentlyContinue
        if ($fTask -and $fTask.State -ne "Running") {
            Start-ScheduledTask -TaskName "AssessmentPortalFrontend"
        }
    }

    Start-Sleep -Seconds 15
}
