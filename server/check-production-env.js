
// Environment check for production deployment
console.log('🔍 Production Environment Check');
console.log('=============================');

console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('PORT:', process.env.PORT || 'Not set');

if (process.env.DATABASE_URL) {
  console.log('✅ DATABASE_URL is configured');
  console.log('URL preview:', process.env.DATABASE_URL.substring(0, 30) + '...');
} else {
  console.log('❌ DATABASE_URL is missing!');
  console.log('Please add it in Render Environment Variables');
}

// Test basic database connection
const db = require('./services/databaseService');

async function testConnection() {
  try {
    if (db.isPostgres) {
      console.log('🐘 Using PostgreSQL');
      const customers = await db.getCustomers();
      console.log(`✅ Connection successful! Found ${customers.length} customers`);
    } else {
      console.log('📁 Using SQLite');
      const customers = await db.getCustomers();
      console.log(`✅ Connection successful! Found ${customers.length} customers`);
    }
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

testConnection();
