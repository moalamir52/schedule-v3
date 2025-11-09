@echo off
echo 🚀 Starting Schedule App with New Database (Supabase)
echo.

echo 📊 Starting Server...
start "Schedule Server" cmd /k "cd server && npm start"

echo ⏳ Waiting for server to start...
timeout /t 5 /nobreak > nul

echo 🎨 Starting Client...
start "Schedule Client" cmd /k "cd client && npm run dev"

echo.
echo ✅ Both server and client are starting...
echo 📱 Client will be available at: http://localhost:5173
echo 🔧 Server API at: http://localhost:54112
echo 💾 Using Supabase Database
echo.
pause