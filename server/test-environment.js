// Test which database is being used
console.log('🔍 Environment Check');
console.log('==================');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('USE_SUPABASE:', process.env.USE_SUPABASE);
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Not set');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'Set' : 'Not set');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

// Test database service
const db = require('./services/databaseService');

console.log('\n🗄️ Database Service Check');
console.log('========================');
console.log('isSupabase:', db.isSupabase);
console.log('isPostgres:', db.isPostgres);

if (db.isSupabase) {
  console.log('✅ Using Supabase database');
} else if (db.isPostgres) {
  console.log('🐘 Using PostgreSQL database');
} else {
  console.log('📁 Using SQLite database');
}