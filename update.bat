@echo off
echo Adding all files to Git...
git add .

set /p commitMessage="Enter a short description for your update: "

echo Committing changes...
git commit -m "%commitMessage%"

echo Pushing updates to GitHub...
git push

echo.
echo Update complete!
pause