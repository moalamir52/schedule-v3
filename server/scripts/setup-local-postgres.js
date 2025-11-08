const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Local PostgreSQL connection
const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'schedule_v3_local',
  user: 'postgres',
  password: 'your_password' // غير كلمة المرور حسب إعدادك
});

async function setupLocalDB() {
  try {
    await client.connect();
    console.log('✅ Connected to local PostgreSQL');

    // Create tables first
    console.log('📋 Creating tables...');
    const schemaPath = path.join(__dirname, '../database/postgres-schema.sql');
    
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await client.query(schema);
      console.log('✅ Tables created');
    } else {
      console.log('⚠️ Schema file not found, creating basic tables...');
      
      // Basic table creation
      const tables = [
        `CREATE TABLE IF NOT EXISTS customers (
          "CustomerID" TEXT PRIMARY KEY,
          "Name" TEXT NOT NULL,
          "Villa" TEXT,
          "CarPlates" TEXT,
          "Washman_Package" TEXT,
          "Days" TEXT,
          "Time" TEXT,
          "Status" TEXT DEFAULT 'Active',
          "Phone" TEXT,
          "Fee" REAL,
          "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        
        `CREATE TABLE IF NOT EXISTS workers (
          "WorkerID" TEXT PRIMARY KEY,
          "Name" TEXT NOT NULL,
          "Job" TEXT,
          "Status" TEXT DEFAULT 'Active'
        )`,
        
        `CREATE TABLE IF NOT EXISTS invoices (
          "InvoiceID" TEXT PRIMARY KEY,
          "Ref" TEXT,
          "CustomerID" TEXT,
          "CustomerName" TEXT,
          "Villa" TEXT,
          "InvoiceDate" DATE,
          "TotalAmount" REAL,
          "Status" TEXT DEFAULT 'Pending',
          "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        
        `CREATE TABLE IF NOT EXISTS "Services" (
          "ServiceID" TEXT PRIMARY KEY,
          "ServiceName" TEXT NOT NULL,
          "Price" REAL,
          "Status" TEXT DEFAULT 'Active'
        )`
      ];
      
      for (const table of tables) {
        await client.query(table);
      }
    }

    // Import data
    console.log('📦 Importing data...');
    const dataPath = path.join(__dirname, '../database/postgres-export.sql');
    
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, 'utf8');
      await client.query(data);
      console.log('✅ Data imported successfully');
    } else {
      console.log('⚠️ Export file not found. Run export script first.');
    }

    await client.end();
    console.log('🎉 Local PostgreSQL setup complete!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupLocalDB();