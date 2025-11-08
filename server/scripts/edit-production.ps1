# Edit Production Database Tool
param(
    [string]$Action,
    [string]$Table,
    [string]$Id,
    [string]$Field,
    [string]$Value
)

$baseUrl = "https://schedule-v3-server.onrender.com/api"

function Show-Usage {
    Write-Host "Usage Examples:" -ForegroundColor Yellow
    Write-Host "  .\edit-production.ps1 -Action update -Table customers -Id 1 -Field name -Value 'New Name'"
    Write-Host "  .\edit-production.ps1 -Action delete -Table customers -Id 1"
    Write-Host "  .\edit-production.ps1 -Action list -Table customers"
    Write-Host ""
    Write-Host "Available Tables: customers, workers, schedule, users" -ForegroundColor Green
}

if (-not $Action) {
    Show-Usage
    exit
}

try {
    switch ($Action.ToLower()) {
        "list" {
            $response = Invoke-RestMethod -Uri "$baseUrl/$Table" -Method GET
            $response | Format-Table -AutoSize
        }
        
        "update" {
            if (-not $Id -or -not $Field -or -not $Value) {
                Write-Host "Error: update requires -Id, -Field, and -Value" -ForegroundColor Red
                Show-Usage
                exit
            }
            
            $body = @{ $Field = $Value } | ConvertTo-Json
            $response = Invoke-RestMethod -Uri "$baseUrl/$Table/$Id" -Method PUT -Body $body -ContentType "application/json"
            Write-Host "Updated successfully!" -ForegroundColor Green
            $response | Format-Table -AutoSize
        }
        
        "delete" {
            if (-not $Id) {
                Write-Host "Error: delete requires -Id" -ForegroundColor Red
                Show-Usage
                exit
            }
            
            $confirm = Read-Host "Are you sure you want to delete $Table with ID $Id? (y/N)"
            if ($confirm -eq 'y' -or $confirm -eq 'Y') {
                Invoke-RestMethod -Uri "$baseUrl/$Table/$Id" -Method DELETE
                Write-Host "Deleted successfully!" -ForegroundColor Green
            } else {
                Write-Host "Cancelled." -ForegroundColor Yellow
            }
        }
        
        default {
            Write-Host "Error: Unknown action '$Action'" -ForegroundColor Red
            Show-Usage
        }
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}