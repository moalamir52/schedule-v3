@echo off
echo 🧪 اختبار إصلاحات قاعدة البيانات...
echo.

cd server

echo 📋 تشغيل اختبار العمليات الأساسية...
node test-database-operations.js

echo.
echo 🌐 اختبار الخادم...
echo يمكنك الآن اختبار APIs التالية:
echo.
echo ✅ إكمال مهمة:
echo POST http://localhost:3001/api/tasks/complete
echo.
echo ❌ إلغاء مهمة:
echo POST http://localhost:3001/api/tasks/cancel
echo.
echo 🧹 تنظيف قسري:
echo POST http://localhost:3001/api/tasks/force-cleanup
echo.
echo 📊 حالة التصحيح:
echo GET http://localhost:3001/api/tasks/debug-status
echo.

pause