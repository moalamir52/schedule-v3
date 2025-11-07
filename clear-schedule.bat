@echo off
echo Clearing all schedule data...
cd server
node clearSchedule.js
echo.
echo Schedule data cleared successfully!
echo Press any key to continue...
pause > nul