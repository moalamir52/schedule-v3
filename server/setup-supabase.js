// Setup Supabase connection
const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up Supabase Connection');
console.log('=================================');

// Update .env file
const envPath = path.join(__dirname, '.env');
const supabaseUrl = 'postgresql://postgres:[YOUR_PASSWORD]@db.gtbtlslrhifwjpzukfmt.supabase.co:5432/postgres';

const envContent = `# Supabase Database Connection
DATABASE_URL=${supabaseUrl}
NODE_ENV=production
SHOW_SERVER_LOGS=true

# Add your actual Supabase password above
# Replace [YOUR_PASSWORD] with your real password
`;

fs.writeFileSync(envPath, envContent);

console.log('✅ .env file updated with Supabase connection');
console.log('');
console.log('📋 Manual steps needed:');
console.log('1. Replace [YOUR_PASSWORD] in the DATABASE_URL with your actual Supabase password');
console.log('2. Run: node migrate-to-supabase.js');
console.log('3. Update DATABASE_URL in Render environment variables');
console.log('4. Deploy to production');
console.log('');
console.log('🔍 Your Supabase connection string:');
console.log(supabaseUrl);
console.log('');
console.log('⚠️  Remember to replace [YOUR_PASSWORD] with your actual password!');

module.exports = { success: true };