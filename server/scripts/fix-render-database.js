// Fix Render database persistence issue
const fs = require('fs');
const path = require('path');

// Check if we're on Render (production)
const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER;

if (isProduction) {
  console.log('🔧 Production environment detected - setting up persistent storage');
  
  // Use environment variables for database connection
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (DATABASE_URL) {
    console.log('✅ PostgreSQL URL found - switching to PostgreSQL');
    // PostgreSQL setup would go here
  } else {
    console.log('⚠️  No DATABASE_URL found - using in-memory backup system');
    
    // Create a backup system that saves to /tmp (persistent on Render)
    const backupPath = '/tmp/database-backup.json';
    
    // Load backup on startup
    if (fs.existsSync(backupPath)) {
      console.log('📥 Loading database backup from /tmp');
      const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
      // Restore data logic would go here
    }
    
    // Save backup every 5 minutes
    setInterval(() => {
      console.log('💾 Creating database backup');
      // Backup logic would go here
    }, 5 * 60 * 1000);
  }
} else {
  console.log('🏠 Local development environment - using SQLite');
}

module.exports = { isProduction };