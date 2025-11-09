@echo off
echo Starting Schedule Management System...

echo Starting Backend Server...
start "Backend Server" cmd /k "cd /d d:\project\schedule-v3\server && npm start"

echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo Starting Frontend Client...
start "Frontend Client" cmd /k "cd /d d:\project\schedule-v3\client && npm run dev"

echo Waiting for frontend to start...
timeout /t 10 /nobreak >nul

echo Opening application in browser...
start "" "http://localhost:5173"

echo System started successfully!
pause