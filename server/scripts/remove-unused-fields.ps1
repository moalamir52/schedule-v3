# Remove Unused Database Fields
param(
    [string]$Table = "customers",
    [string[]]$FieldsToRemove
)

$baseUrl = "https://schedule-v3-server.onrender.com/api"

function Show-TableStructure {
    param([string]$TableName)
    
    Write-Host "Current $TableName structure:" -ForegroundColor Yellow
    $data = Invoke-RestMethod -Uri "$baseUrl/$TableName" -Method GET
    if ($data -and $data.Count -gt 0) {
        $firstRecord = $data[0]
        $firstRecord.PSObject.Properties | ForEach-Object {
            Write-Host "  - $($_.Name): $($_.Value)" -ForegroundColor Cyan
        }
    }
}

function Remove-FieldsFromRecords {
    param(
        [string]$TableName,
        [string[]]$Fields
    )
    
    Write-Host "Removing fields: $($Fields -join ', ') from $TableName" -ForegroundColor Yellow
    
    # Get all records
    $records = Invoke-RestMethod -Uri "$baseUrl/$TableName" -Method GET
    
    foreach ($record in $records) {
        $id = $record.id
        $cleanRecord = @{}
        
        # Copy all fields except the ones to remove
        $record.PSObject.Properties | ForEach-Object {
            if ($_.Name -notin $Fields -and $_.Name -ne 'id') {
                $cleanRecord[$_.Name] = $_.Value
            }
        }
        
        try {
            $body = $cleanRecord | ConvertTo-Json
            Invoke-RestMethod -Uri "$baseUrl/$TableName/$id" -Method PUT -Body $body -ContentType "application/json"
            Write-Host "Updated record ID: $id" -ForegroundColor Green
        } catch {
            Write-Host "Error updating record ID: $id - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

# Show usage if no parameters
if (-not $FieldsToRemove) {
    Write-Host "Database Field Remover" -ForegroundColor Yellow
    Write-Host "=====================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Usage: .\remove-unused-fields.ps1 -Table customers -FieldsToRemove @('field1', 'field2')"
    Write-Host ""
    Write-Host "Available tables: customers, workers, schedule, users"
    Write-Host ""
    
    Show-TableStructure $Table
    
    Write-Host ""
    Write-Host "Example commands:" -ForegroundColor Green
    Write-Host "  .\remove-unused-fields.ps1 -Table customers -FieldsToRemove @('unusedField1', 'oldField2')"
    Write-Host "  .\remove-unused-fields.ps1 -Table workers -FieldsToRemove @('tempField')"
    
    exit
}

# Confirm before proceeding
Write-Host "WARNING: This will remove the following fields from ALL records in $Table table:" -ForegroundColor Red
$FieldsToRemove | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
Write-Host ""

$confirm = Read-Host "Are you sure you want to proceed? This cannot be undone! (type 'YES' to confirm)"
if ($confirm -ne 'YES') {
    Write-Host "Operation cancelled." -ForegroundColor Yellow
    exit
}

# Show current structure
Show-TableStructure $Table

# Remove fields
Remove-FieldsFromRecords $Table $FieldsToRemove

Write-Host ""
Write-Host "Fields removed successfully!" -ForegroundColor Green
Write-Host "Updated structure:" -ForegroundColor Yellow
Show-TableStructure $Table