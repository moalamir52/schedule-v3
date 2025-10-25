# collect_assignment_debug.ps1
# Usage: run this from repository root in PowerShell after starting the server.
# It will: clear logs, capture timestamp, call force-generate, and fetch logs/assignment-stats/workers/schedule

param(
    [int]$weekOffset = 0,
    [string]$apiBase = 'http://localhost:5000'
)

function Save-JsonToFile($obj, $path) {
    $json = $obj | ConvertTo-Json -Depth 10
    $json | Out-File -FilePath $path -Encoding UTF8
}

$timestamp = (Get-Date).ToString('yyyyMMdd-HHmmss')
$outDir = Join-Path -Path (Get-Location) -ChildPath "debug-output"
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

Write-Host "[DEBUG-SCRIPT] Clearing server log buffer..."
try {
    Invoke-RestMethod -Method Post -Uri "$apiBase/api/debug/logs/clear" -ErrorAction Stop | Out-Null
    Write-Host "[DEBUG-SCRIPT] Cleared logs"
} catch {
    Write-Warning "Failed to clear logs: $_"
}

$since = (Get-Date).ToString('o')
Write-Host "[DEBUG-SCRIPT] Since timestamp: $since"

Write-Host "[DEBUG-SCRIPT] Triggering force-generate (weekOffset=$weekOffset)..."
try {
    $body = @{ weekOffset = $weekOffset } | ConvertTo-Json
    $fg = Invoke-RestMethod -Method Post -Uri "$apiBase/api/auto-schedule/force-generate" -ContentType 'application/json' -Body $body -ErrorAction Stop
    $fgPath = Join-Path $outDir "force-generate-$timestamp.json"
    Save-JsonToFile $fg $fgPath
    Write-Host "[DEBUG-SCRIPT] Force-generate response saved to $fgPath"
} catch {
    Write-Warning "Force-generate failed: $_"
}

Start-Sleep -Seconds 1

Write-Host "[DEBUG-SCRIPT] Fetching assignment logs since $since..."
try {
    $logs = Invoke-RestMethod -Method Get -Uri "$apiBase/api/debug/logs?since=$since&level=assign" -ErrorAction Stop
    $logsPath = Join-Path $outDir "logs-assign-$timestamp.json"
    Save-JsonToFile $logs $logsPath
    Write-Host "[DEBUG-SCRIPT] Assignment logs saved to $logsPath"
} catch {
    Write-Warning "Failed to fetch logs: $_"
}

Write-Host "[DEBUG-SCRIPT] Fetching assignment-stats..."
try {
    $stats = Invoke-RestMethod -Method Get -Uri "$apiBase/api/debug/assignment-stats" -ErrorAction Stop
    $statsPath = Join-Path $outDir "assignment-stats-$timestamp.json"
    Save-JsonToFile $stats $statsPath
    Write-Host "[DEBUG-SCRIPT] Assignment stats saved to $statsPath"
} catch {
    Write-Warning "Failed to fetch assignment-stats: $_"
}

Write-Host "[DEBUG-SCRIPT] Fetching workers list..."
try {
    $workers = Invoke-RestMethod -Method Get -Uri "$apiBase/api/workers" -ErrorAction Stop
    $workersPath = Join-Path $outDir "workers-$timestamp.json"
    Save-JsonToFile $workers $workersPath
    Write-Host "[DEBUG-SCRIPT] Workers saved to $workersPath"
} catch {
    Write-Warning "Failed to fetch workers: $_"
}

Write-Host "[DEBUG-SCRIPT] Fetching current schedule..."
try {
    $schedule = Invoke-RestMethod -Method Get -Uri "$apiBase/api/schedule/assign/current" -ErrorAction Stop
    $schedulePath = Join-Path $outDir "schedule-current-$timestamp.json"
    Save-JsonToFile $schedule $schedulePath
    Write-Host "[DEBUG-SCRIPT] Schedule saved to $schedulePath"
} catch {
    Write-Warning "Failed to fetch schedule: $_"
}

Write-Host "[DEBUG-SCRIPT] Done. Files are in: $outDir"
Write-Host "Please attach or paste the contents of the generated files (force-generate, logs, assignment-stats, workers, schedule) for analysis."