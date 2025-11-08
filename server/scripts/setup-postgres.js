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
    
    // Create wash_history table
    await client.query(`
      CREATE TABLE IF NOT EXISTS wash_history (
        id SERIAL PRIMARY KEY,
        "WashID" TEXT,
        "CustomerID" TEXT,
        "CarPlate" TEXT,
        "WashDate" TEXT,
        "PackageType" TEXT,
        "Villa" TEXT,
        "WashTypePerformed" TEXT,
        "WorkerName" TEXT
      )
    `);
    
    // Create invoices table
    await client.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        "InvoiceID" TEXT UNIQUE,
        "Ref" TEXT,
        "CustomerID" TEXT,
        "CustomerName" TEXT,
        "Villa" TEXT,
        "InvoiceDate" TEXT,
        "TotalAmount" DECIMAL,
        "Status" TEXT DEFAULT 'Pending',
        "CreatedAt" TEXT
      )
    `);
    
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        "UserID" TEXT UNIQUE,
        "Username" TEXT UNIQUE,
        "Password" TEXT,
        "Role" TEXT,
        "Status" TEXT DEFAULT 'Active'
      )
    `);
    
    // Create scheduled_tasks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS scheduled_tasks (
        id SERIAL PRIMARY KEY,
        "Day" TEXT,
        "AppointmentDate" TEXT,
        "Time" TEXT,
        "CustomerID" TEXT,
        "CustomerName" TEXT,
        "Villa" TEXT,
        "CarPlate" TEXT,
        "WashType" TEXT,
        "WorkerName" TEXT,
        "PackageType" TEXT
      )
    `);
    
    console.log('✅ All PostgreSQL tables created');
    
    // Check if data exists
    const customerCount = await client.query('SELECT COUNT(*) FROM customers');
    const workerCount = await client.query('SELECT COUNT(*) FROM workers');
    const invoiceCount = await client.query('SELECT COUNT(*) FROM invoices');
    const historyCount = await client.query('SELECT COUNT(*) FROM wash_history');
    
    console.log(`📊 Customers: ${customerCount.rows[0].count}`);
    console.log(`📊 Workers: ${workerCount.rows[0].count}`);
    console.log(`📊 Invoices: ${invoiceCount.rows[0].count}`);
    console.log(`📊 History: ${historyCount.rows[0].count}`);
    
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