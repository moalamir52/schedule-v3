@echo off
echo Production Database Editor
echo ========================
echo.
echo 1. List all customers
echo 2. Update customer
echo 3. Delete customer
echo 4. List workers
echo 5. Update worker
echo 6. Delete worker
echo 7. Custom command
echo 8. Exit
echo.
set /p choice="Choose option (1-8): "

if "%choice%"=="1" (
    powershell -ExecutionPolicy Bypass -File "edit-production.ps1" -Action list -Table customers
    pause
    goto :start
)
if "%choice%"=="2" (
    set /p id="Enter customer ID: "
    set /p field="Enter field to update (name, phone, address, etc.): "
    set /p value="Enter new value: "
    powershell -ExecutionPolicy Bypass -File "edit-production.ps1" -Action update -Table customers -Id "%id%" -Field "%field%" -Value "%value%"
    pause
    goto :start
)
if "%choice%"=="3" (
    set /p id="Enter customer ID to delete: "
    powershell -ExecutionPolicy Bypass -File "edit-production.ps1" -Action delete -Table customers -Id "%id%"
    pause
    goto :start
)
if "%choice%"=="4" (
    powershell -ExecutionPolicy Bypass -File "edit-production.ps1" -Action list -Table workers
    pause
    goto :start
)
if "%choice%"=="5" (
    set /p id="Enter worker ID: "
    set /p field="Enter field to update: "
    set /p value="Enter new value: "
    powershell -ExecutionPolicy Bypass -File "edit-production.ps1" -Action update -Table workers -Id "%id%" -Field "%field%" -Value "%value%"
    pause
    goto :start
)
if "%choice%"=="6" (
    set /p id="Enter worker ID to delete: "
    powershell -ExecutionPolicy Bypass -File "edit-production.ps1" -Action delete -Table workers -Id "%id%"
    pause
    goto :start
)
if "%choice%"=="7" (
    echo Enter custom PowerShell command:
    set /p cmd="Command: "
    powershell -ExecutionPolicy Bypass -Command "%cmd%"
    pause
    goto :start
)
if "%choice%"=="8" exit

:start
cls
goto :eof