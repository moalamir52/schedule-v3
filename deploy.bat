@echo off
echo Deploying Schedule Management System to GitHub...

echo Adding all changes...
git add .

echo Committing changes...
set /p commit_msg="Enter commit message (or press Enter for default): "
if "%commit_msg%"=="" set commit_msg=Update project files

git commit -m "%commit_msg%"

echo Pushing to GitHub...
git push origin main

echo Deployment completed successfully!
pause