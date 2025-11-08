require('dotenv').config();
const { Client } = require('pg');

async function checkPostgresUsers() {
  try {
    console.log('🔍 Checking PostgreSQL users table...');
    
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    await client.connect();
    
    // Check if users table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    console.log('Users table exists:', tableCheck.rows[0].exists);
    
    if (tableCheck.rows[0].exists) {
      // Get all users
      const users = await client.query('SELECT * FROM users');
      console.log(`\n👥 Found ${users.rows.length} users:`);
      users.rows.forEach((user, i) => {
        console.log(`${i + 1}. ID: ${user.id} | Username: "${user.username}" | Password: "${user.password}"`);
      });
    } else {
      console.log('❌ Users table does not exist!');
      
      // Create users table and add default users
      console.log('🔧 Creating users table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Add default users
      console.log('👤 Adding default users...');
      await client.query(`
        INSERT INTO users (username, password) VALUES 
        ('admin', 'admin123'),
        ('Marwan', 'marwan123')
        ON CONFLICT (username) DO NOTHING
      `);
      
      // Verify users were added
      const newUsers = await client.query('SELECT * FROM users');
      console.log(`✅ Added ${newUsers.rows.length} users:`);
      newUsers.rows.forEach((user, i) => {
        console.log(`${i + 1}. Username: "${user.username}" | Password: "${user.password}"`);
      });
    }
    
    await client.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkPostgresUsers();