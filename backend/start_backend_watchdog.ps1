# =====================================================================
# Assessment Portal - Backend Watchdog & Auto-Restart Supervisor
# =====================================================================
# Features:
# - Detects & activates virtual environment (if available)
# - Boots FastAPI backend (run.py)
# - Automatically restarts on any crash / unexpected exit
# - Writes output and crash logs to backend_supervisor.log
# - Works seamlessly both interactively and headless in Task Scheduler
# =====================================================================

$BackendDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location -Path $BackendDir

$LogFile = Join-Path $BackendDir "backend_supervisor.log"

function Log-Message {
    param([string]$Message, [string]$Color = "White")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $Formatted = "[$Timestamp] $Message"
    
    # Write to screen if console is available
    if ($Host.UI.RawUI -ne $null) {
        Write-Host $Formatted -ForegroundColor $Color
    }
    
    # Append to log file
    Add-Content -Path $LogFile -Value $Formatted -ErrorAction SilentlyContinue
}

Log-Message "==========================================================" "Cyan"
Log-Message "  NASC Assessment Portal - Backend Auto-Restart Watchdog  " "White"
Log-Message "==========================================================" "Cyan"
Log-Message "Working Directory: $BackendDir" "DarkGray"
Log-Message "Logging output to: $LogFile" "DarkGray"

# ---------------------------------------------------------------------
# Step 1: Detect and Activate Python Environment
# ---------------------------------------------------------------------
$VenvPaths = @(
    "$BackendDir\venv\Scripts\Activate.ps1",
    "$BackendDir\..\venv\Scripts\Activate.ps1",
    "$BackendDir\.venv\Scripts\Activate.ps1",
    "$BackendDir\..\.venv\Scripts\Activate.ps1",
    "$BackendDir\env\Scripts\Activate.ps1"
)

$Activated = $false
foreach ($Path in $VenvPaths) {
    if (Test-Path -Path $Path) {
        Log-Message "[INIT] Activating virtual environment: $Path" "Green"
        & $Path
        $Activated = $true
        break
    }
}

if (-not $Activated) {
    $SysPython = Get-Command python -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
    Log-Message "[INIT] No local venv found. Using system Python: $SysPython" "Yellow"
}

# ---------------------------------------------------------------------
# Step 2: Continuous Supervisor Loop
# ---------------------------------------------------------------------
$RestartCount = 0

while ($true) {
    Log-Message ">>> Starting Backend Server (python run.py) [Attempt #$($RestartCount + 1)]..." "Green"
    
    # Execute python and stream output to both console and log file
    try {
        & python -u run.py *>> $LogFile
        $ExitCode = $LASTEXITCODE
    } catch {
        Log-Message "[ERROR] Exception starting python process: $_" "Red"
        $ExitCode = 1
    }

    $RestartCount++

    if ($ExitCode -eq 0) {
        Log-Message "Backend process exited cleanly (Exit Code 0). Auto-restarting in 3 seconds..." "Cyan"
        Start-Sleep -Seconds 3
    } else {
        Log-Message "[CRASH DETECTED] Backend stopped with Exit Code: $ExitCode" "Red"
        Log-Message "Total crashes/restarts recorded: $RestartCount" "Yellow"
        Log-Message "Cooling down for 3 seconds before auto-restart..." "Magenta"
        Start-Sleep -Seconds 3
    }
}
