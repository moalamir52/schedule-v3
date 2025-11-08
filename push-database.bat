@echo off
echo Push Local Database to Server
echo =============================
echo.
echo WARNING: This will overwrite ALL data on the production server!
echo.
set /p confirm="Are you sure? Type 'YES' to confirm: "
if not "%confirm%"=="YES" (
    echo Cancelled.
    pause
    exit
)

echo.
echo Pushing local database to server...
cd server
node scripts\sync-database.js push
cd ..

echo.
echo Done!
pause