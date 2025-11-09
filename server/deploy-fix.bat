@echo off
echo 🚀 Deploying Database Fix to Production
echo =====================================

echo 📦 Installing dependencies...
npm install

echo 🔧 Running PostgreSQL service fix...
node fix-postgres-service.js

echo 🔄 Syncing production schema...
node sync-production-schema.js

echo 🧪 Testing database connection...
node fix-database-connection.js

echo ✅ Production database fix completed!
echo 🔄 Please restart your Render service to apply changes.

pause