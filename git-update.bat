@echo off
echo 🔄 Updating Git Repository for Render...
echo.

echo 📝 Adding all changes...
git add .

echo 💾 Committing changes...
git commit -m "Update to Supabase database - persistent data storage"

echo 🚀 Pushing to repository...
git push origin main

echo.
echo ✅ Done! Render will auto-deploy the updates.
echo 🔗 Check your Render dashboard for deployment status.
pause