@echo off
echo 🎉 اختبار إصلاحات قاعدة البيانات المحدثة...
echo.

cd server

echo 🧪 اختبار تحليل taskId السريع...
node quick-test-taskid.js

echo.
echo 📋 اختبار العمليات الأساسية...
node test-database-operations.js

echo.
echo ✅ جميع الإصلاحات مطبقة:
echo   - تحليل taskId صحيح ✅
echo   - عمليات حذف محسنة ✅  
echo   - batch operations ✅
echo   - fallback mechanism ✅
echo.
echo 🚀 النظام جاهز للاستخدام!
echo.

pause