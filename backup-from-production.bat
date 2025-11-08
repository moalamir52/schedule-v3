@echo off
echo 📥 نسخ احتياطي من الإنتاج
echo.
set /p BACKEND_URL="ادخل رابط الـ Backend (مثل: https://your-backend.onrender.com): "
echo.
echo 🔄 بدء النسخ الاحتياطي من: %BACKEND_URL%
cd server
node scripts/productionBackup.js %BACKEND_URL%
echo.
echo ✅ انتهى النسخ الاحتياطي
pause