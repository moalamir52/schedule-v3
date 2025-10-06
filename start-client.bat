@echo off
echo Starting Client...
cd client
start "" npm run dev
timeout /t 5 /nobreak >nul
start http://localhost:5173
echo Client started and browser opened
pause