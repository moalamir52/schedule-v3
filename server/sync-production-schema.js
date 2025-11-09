const { Client } = require('pg');

async function syncProductionSchema() {
  console.log('🔄 Syncing Production Database Schema with Local SQLite');
  console.log('====================================================');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found!');
    return;
  }
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');
    
    // Drop and recreate tables to match SQLite schema exactly
    const tables = [
      {
        name: 'customers',
        schema: `
          CREATE TABLE IF NOT EXISTS customers (
            "CustomerID" TEXT PRIMARY KEY,
            "Name" TEXT NOT NULL,
            "Villa" TEXT,
            "CarPlates" TEXT,
            "Washman_Package" TEXT,
            "Days" TEXT,
            "Time" TEXT,
            "Status" TEXT DEFAULT 'Active',
            "Phone" TEXT,
            "Email" TEXT,
            "Notes" TEXT,
            "Fee" DECIMAL,
            "Number of car" INTEGER,
            "start date" TEXT
          );
        `
      },
      {
        name: 'workers',
        schema: `
          CREATE TABLE IF NOT EXISTS workers (
            "WorkerID" TEXT,
            "Name" TEXT NOT NULL,
            "Phone" TEXT,
            "Status" TEXT DEFAULT 'Active',
            "Specialization" TEXT,
            "HourlyRate" DECIMAL
          );
        `
      },
      {
        name: 'wash_history',
        schema: `
          CREATE TABLE IF NOT EXISTS wash_history (
            "WashID" TEXT PRIMARY KEY,
            "CustomerID" TEXT,
            "CarPlate" TEXT,
            "WashDate" TEXT,
            "PackageType" TEXT,
            "Villa" TEXT,
            "WashTypePerformed" TEXT,
            "VisitNumberInWeek" INTEGER,
            "WeekInCycle" INTEGER,
            "Status" TEXT,
            "WorkerName" TEXT
          );
        `
      },
      {
        name: 'ScheduledTasks',
        schema: `
          CREATE TABLE IF NOT EXISTS "ScheduledTasks" (
            "Day" TEXT,
            "AppointmentDate" TEXT,
            "Time" TEXT,
            "CustomerID" TEXT,
            "CustomerName" TEXT,
            "Villa" TEXT,
            "CarPlate" TEXT,
            "WashType" TEXT,
            "WorkerName" TEXT,
            "WorkerID" TEXT,
            "PackageType" TEXT,
            "isLocked" TEXT DEFAULT 'FALSE',
            "ScheduleDate" TEXT
          );
        `
      },
      {
        name: 'invoices',
        schema: `
          CREATE TABLE IF NOT EXISTS invoices (
            "InvoiceID" TEXT PRIMARY KEY,
            "Ref" TEXT UNIQUE,
            "CustomerID" TEXT,
            "CustomerName" TEXT,
            "Villa" TEXT,
            "InvoiceDate" TEXT,
            "DueDate" TEXT,
            "TotalAmount" DECIMAL,
            "Status" TEXT DEFAULT 'Pending',
            "PaymentMethod" TEXT,
            "Start" TEXT,
            "End" TEXT,
            "Vehicle" TEXT,
            "PackageID" TEXT,
            "Services" TEXT,
            "Notes" TEXT,
            "CreatedBy" TEXT,
            "CreatedAt" TEXT,
            "SubTotal" DECIMAL,
            "Phone" TEXT,
            "Payment" TEXT,
            "Subject" TEXT
          );
        `
      },
      {
        name: 'Users',
        schema: `
          CREATE TABLE IF NOT EXISTS "Users" (
            "UserID" TEXT PRIMARY KEY,
            "Username" TEXT UNIQUE NOT NULL,
            "Password" TEXT NOT NULL,
            "PlainPassword" TEXT,
            "Role" TEXT NOT NULL,
            "Status" TEXT DEFAULT 'Active',
            "CreatedAt" TEXT
          );
        `
      },
      {
        name: 'Services',
        schema: `
          CREATE TABLE IF NOT EXISTS "Services" (
            "ServiceID" TEXT,
            "ServiceName" TEXT NOT NULL,
            "Price" DECIMAL,
            "Description" TEXT,
            "Status" TEXT DEFAULT 'Active'
          );
        `
      }
    ];
    
    // Recreate each table
    for (const table of tables) {
      console.log(`🔧 Recreating table: ${table.name}`);
      
      // Drop table if exists
      await client.query(`DROP TABLE IF EXISTS ${table.name} CASCADE`);
      await client.query(`DROP TABLE IF EXISTS "${table.name}" CASCADE`);
      
      // Create new table
      await client.query(table.schema);
      console.log(`✅ Table ${table.name} created successfully`);
    }
    
    // Add some default workers if none exist
    const workersCount = await client.query('SELECT COUNT(*) FROM workers');
    if (parseInt(workersCount.rows[0].count) === 0) {
      console.log('🔧 Adding default workers...');
      
      const defaultWorkers = [
        { WorkerID: 'WORKER-001', Name: 'Ahmed', Status: 'Active' },
        { WorkerID: 'WORKER-002', Name: 'Mohamed', Status: 'Active' },
        { WorkerID: 'WORKER-003', Name: 'Ali', Status: 'Active' }
      ];
      
      for (const worker of defaultWorkers) {
        await client.query(
          'INSERT INTO workers ("WorkerID", "Name", "Status") VALUES ($1, $2, $3)',
          [worker.WorkerID, worker.Name, worker.Status]
        );
      }
      console.log(`✅ Added ${defaultWorkers.length} default workers`);
    }
    
    // Test all tables
    console.log('🧪 Testing all tables...');
    for (const table of tables) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM ${table.name.includes('ScheduledTasks') || table.name.includes('Users') || table.name.includes('Services') ? `"${table.name}"` : table.name}`);
        console.log(`✅ ${table.name}: ${result.rows[0].count} records`);
      } catch (error) {
        console.error(`❌ ${table.name}: ${error.message}`);
      }
    }
    
    console.log('🎉 Production database schema synchronized successfully!');
    
  } catch (error) {
    console.error('❌ Schema sync failed:', error);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  syncProductionSchema();
}

module.exports = { syncProductionSchema };