@echo off
echo Starting Server and Client...
start "Server" cmd /k "cd server && npm start"
timeout /t 3 /nobreak >nul
start "Client" cmd /k "cd client && npm run dev"
timeout /t 5 /nobreak >nul
start http://localhost:5173
echo Both services started and browser opened
pause