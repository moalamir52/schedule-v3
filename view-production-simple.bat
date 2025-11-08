@echo off
echo Production Database Viewer (Simple)
echo.
echo Choose operation:
echo 1. View all customers
echo 2. View workers  
echo 3. View current schedule
echo 4. View database info
echo 5. Custom API call
echo.
set /p choice="Enter operation number (1-5): "

if "%choice%"=="1" (
    echo Fetching customers from production...
    powershell -Command "Invoke-RestMethod -Uri 'https://schedule-v3-server.onrender.com/api/customers' | ConvertTo-Json -Depth 10"
) else if "%choice%"=="2" (
    echo Fetching workers from production...
    powershell -Command "Invoke-RestMethod -Uri 'https://schedule-v3-server.onrender.com/api/workers' | ConvertTo-Json -Depth 10"
) else if "%choice%"=="3" (
    echo Fetching current schedule from production...
    powershell -Command "Invoke-RestMethod -Uri 'https://schedule-v3-server.onrender.com/api/schedule/assign/current' | ConvertTo-Json -Depth 10"
) else if "%choice%"=="4" (
    echo Fetching database info from production...
    powershell -Command "Invoke-RestMethod -Uri 'https://schedule-v3-server.onrender.com/api/database-info' | ConvertTo-Json -Depth 10"
) else if "%choice%"=="5" (
    set /p endpoint="Enter API endpoint (e.g. /api/customers): "
    echo Fetching from production...
    powershell -Command "Invoke-RestMethod -Uri 'https://schedule-v3-server.onrender.com%endpoint%' | ConvertTo-Json -Depth 10"
) else (
    echo Invalid choice
)

echo.
pause