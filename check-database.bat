@echo off
echo 📊 فحص معلومات قاعدة البيانات...
cd server
node scripts/databaseBackup.js info
pause