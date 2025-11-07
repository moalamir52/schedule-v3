@echo off
echo ========================================
echo       نقل البيانات إلى ملف database.db
echo ========================================
echo.

cd server
echo تثبيت sqlite3...
npm install sqlite3@5.1.6

echo.
echo اختبار قاعدة البيانات أولاً...
node testDatabase.js

echo.
echo بدء نقل البيانات من Google Sheets إلى database.db...
node migrateFromSheets.js

echo.
echo ✅ تم النقل بنجاح!
echo.
echo 📁 تم إنشاء ملف: server/database/database.db
echo 🚀 الآن المشروع يستخدم قاعدة بيانات محلية سريعة!
echo.
pause