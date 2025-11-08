@echo off
echo Database Update Tool
echo.
echo Choose operation:
echo 1. Update existing customer
echo 2. Add new customer  
echo 3. Delete customer
echo 4. Bulk update from file
echo 5. Run custom query
echo.
set /p choice="Enter operation number (1-5): "

cd server

if "%choice%"=="1" (
    set /p customerid="Enter customer ID (e.g. CUST-001): "
    set /p updates="Enter updates in JSON format (e.g. {\"Name\":\"New Name\"}): "
    node scripts/updateDatabase.js update %customerid% "%updates%"
) else if "%choice%"=="2" (
    set /p customerdata="Enter customer data in JSON format: "
    node scripts/updateDatabase.js add "%customerdata%"
) else if "%choice%"=="3" (
    set /p customerid="Enter customer ID to delete: "
    node scripts/updateDatabase.js delete %customerid%
) else if "%choice%"=="4" (
    set /p filename="Enter backup filename: "
    node scripts/updateDatabase.js bulk %filename%
) else if "%choice%"=="5" (
    set /p query="Enter SQL query: "
    node scripts/updateDatabase.js query "%query%"
) else (
    echo Invalid choice
)

echo.
pause