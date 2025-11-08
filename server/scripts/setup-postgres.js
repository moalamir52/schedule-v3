// Setup PostgreSQL tables
const { Client } = require('pg');

async function setupPostgreSQL() {
  console.log('🐘 Setting up PostgreSQL database...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');
    
    // Create customers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        "CustomerID" TEXT UNIQUE,
        "Name" TEXT,
        "Villa" TEXT,
        "CarPlates" TEXT,
        "Washman_Package" TEXT,
        "Days" TEXT,
        "Time" TEXT,
        "Status" TEXT DEFAULT 'Active',
        "Phone" TEXT,
        "Notes" TEXT,
        "Fee" DECIMAL,
        "Number of car" INTEGER,
        "start date" TEXT
      )
    `);
    
    // Create workers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS workers (
        id SERIAL PRIMARY KEY,
        "WorkerID" TEXT,
        "Name" TEXT,
        "Phone" TEXT,
        "Status" TEXT DEFAULT 'Active'
      )
    `);
    
    console.log('✅ PostgreSQL tables created');
    
    // Check if data exists
    const customerCount = await client.query('SELECT COUNT(*) FROM customers');
    const workerCount = await client.query('SELECT COUNT(*) FROM workers');
    
    console.log(`📊 Customers: ${customerCount.rows[0].count}`);
    console.log(`📊 Workers: ${workerCount.rows[0].count}`);
    
    await client.end();
    
  } catch (error) {
    console.error('❌ PostgreSQL setup failed:', error.message);
    await client.end();
  }
}

if (require.main === module) {
  setupPostgreSQL();
}

module.exports = { setupPostgreSQL };