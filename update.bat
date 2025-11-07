@echo off
echo Adding files to Git (excluding database)...
git add .
git reset server/database/database.db

set /p commitMessage="Enter a short description for your update: "

echo Committing changes...
git commit -m "%commitMessage%"

echo Pushing updates to GitHub...
git push

echo.
echo Update complete!
pause