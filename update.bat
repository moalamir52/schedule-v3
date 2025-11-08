@echo off
echo Git Update and Deploy Script
echo ===========================
echo.

echo Creating database backup...
node server\scripts\databaseBackup.js

echo.
echo Adding all changes to git...
git add .

echo.
set /p message="Enter commit message: "
if "%message%"=="" set message="Update project files with database backup"

echo.
echo Committing changes...
git commit -m "%message%"

echo.
echo Pushing to GitHub...
git push origin main

echo.
echo Done! Changes and database backup pushed to GitHub.
pause