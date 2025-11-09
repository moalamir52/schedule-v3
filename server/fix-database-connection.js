const fs = require('fs');
const path = require('path');

console.log('🔧 Database Connection Fix Script');
console.log('================================');

// Check current environment
console.log('Current NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);

// Check if we're in production (Render)
const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER;

if (isProduction) {
  console.log('🚀 Production environment detected');
  
  // Check if DATABASE_URL is available
  if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL not found in production environment!');
    console.log('This should be set in Render dashboard under Environment Variables');
    process.exit(1);
  }
  
  console.log('✅ DATABASE_URL found in production');
  console.log('URL preview:', process.env.DATABASE_URL.substring(0, 30) + '...');
} else {
  console.log('🏠 Local environment detected');
  console.log('Using SQLite database');
}

// Test database connection
async function testConnection() {
  try {
    const db = require('./services/databaseService');
    
    if (db.isPostgres) {
      console.log('🐘 Testing PostgreSQL connection...');
      const customers = await db.getCustomers();
      console.log(`✅ PostgreSQL connection successful! Found ${customers.length} customers`);
    } else {
      console.log('📁 Testing SQLite connection...');
      const customers = await db.getCustomers();
      console.log(`✅ SQLite connection successful! Found ${customers.length} customers`);
    }
    
    // Test workers
    const workers = await db.getWorkers();
    console.log(`✅ Workers table accessible! Found ${workers.length} workers`);
    
    // Test scheduled tasks
    const tasks = await db.getScheduledTasks();
    console.log(`✅ ScheduledTasks table accessible! Found ${tasks.length} tasks`);
    
    console.log('🎉 All database connections working properly!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Provide specific error guidance
    if (error.message.includes('connect ECONNREFUSED')) {
      console.log('💡 Suggestion: Check if PostgreSQL server is running');
    } else if (error.message.includes('authentication failed')) {
      console.log('💡 Suggestion: Check DATABASE_URL credentials');
    } else if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.log('💡 Suggestion: Database may need to be created');
    }
    
    process.exit(1);
  }
}

// Run the test
testConnection();