@echo off
echo Pull Server Database to Local
echo ==============================
echo.
echo WARNING: This will overwrite your local database!
echo.
set /p confirm="Are you sure? Type 'y' to confirm: "
if not "%confirm%"=="y" (
    echo Cancelled.
    pause
    exit
)

echo.
echo Downloading server data...
cd server
node scripts\simple-sync.js pull
cd ..

echo.
echo Done! Local database updated.
pause