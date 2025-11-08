Write-Host "Fetching current schedule from production..." -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "https://schedule-v3-server.onrender.com/api/schedule/assign/current"
    
    if ($response.assignments) {
        $assignments = $response.assignments
        Write-Host "`nTotal assignments: $($assignments.Count)" -ForegroundColor Yellow
        Write-Host "=" * 80
        
        $groupedByDay = $assignments | Group-Object -Property day
        
        foreach ($dayGroup in $groupedByDay) {
            Write-Host "`n$($dayGroup.Name.ToUpper())" -ForegroundColor Cyan
            Write-Host "-" * 20
            
            $sortedTasks = $dayGroup.Group | Sort-Object time
            foreach ($task in $sortedTasks) {
                Write-Host "$($task.time) - $($task.customerName) ($($task.carPlate)) - $($task.washType) - Worker: $($task.workerName)" -ForegroundColor White
            }
        }
    } else {
        Write-Host "No schedule data found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error fetching schedule: $($_.Exception.Message)" -ForegroundColor Red
}

Read-Host "`nPress Enter to continue"