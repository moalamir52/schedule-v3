@echo off
echo 🔄 بدء عمل نسخة احتياطية من قاعدة البيانات...
cd server
node scripts/databaseBackup.js backup
echo ✅ انتهت عملية النسخ الاحتياطي
pause