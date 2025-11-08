@echo off
echo Keep Server Alive Service
echo =========================
echo This will ping the server every 5 minutes to prevent data loss
echo Press Ctrl+C to stop
echo.

cd server
node scripts\keep-alive.js