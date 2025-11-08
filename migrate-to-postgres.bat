@echo off
echo Migrate Data to PostgreSQL
echo ==========================
echo.
echo Step 1: Download current production data...
cd server
node scripts\simple-sync.js pull
echo.
echo Step 2: The data is now saved as JSON backup
echo Step 3: After PostgreSQL is connected, we'll need to upload this data
echo.
echo Next: Add DATABASE_URL to Render, then run upload script
pause