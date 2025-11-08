@echo off
echo ========================================
echo   PostgreSQL Local Setup Script
echo ========================================
echo.

echo Step 1: Exporting data from Render...
cd server
node scripts/export-postgres-data.js

echo.
echo Step 2: Setting up local PostgreSQL...
echo Make sure PostgreSQL is installed and running locally
echo Update the password in setup-local-postgres.js before running
pause

node scripts/setup-local-postgres.js

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Update your .env file to use local PostgreSQL
echo 2. Set DATABASE_URL=postgresql://postgres:your_password@localhost:5432/schedule_v3_local
echo 3. Restart your server
echo.
pause