@echo off
echo ========================================
echo 🚀 Starting Client with Fixed API URL
echo ========================================
echo.
echo API URL: https://schedule-v3-server.onrender.com
echo.
cd client
echo Installing dependencies...
call npm install
echo.
echo Starting development server...
call npm run dev
pause