// Create clean Supabase schema without empty field columns
const { Client } = require('pg');

const SUPABASE_URL = 'postgresql://postgres:Moh@med!2020@db.gtbtlslrhifwjpzukfmt.supabase.co:5432/postgres';

async function createCleanSupabaseSchema() {
  console.log('🧹 Creating Clean Supabase Schema');
  console.log('=================================');
  
  const client = new Client({
    connectionString: SUPABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  await client.connect();
  console.log('✅ Connected to Supabase');
  
  try {
    // Drop existing tables
    console.log('🗑️  Dropping existing tables...');
    const dropTables = [
      'DROP TABLE IF EXISTS assignments CASCADE',
      'DROP TABLE IF EXISTS "Workers" CASCADE',
      'DROP TABLE IF EXISTS "WashRules" CASCADE', 
      'DROP TABLE IF EXISTS wash_history CASCADE',
      'DROP TABLE IF EXISTS "Users" CASCADE',
      'DROP TABLE IF EXISTS "Services" CASCADE',
      'DROP TABLE IF EXISTS "ScheduleAuditLog" CASCADE',
      'DROP TABLE IF EXISTS deleted_invoices CASCADE',
      'DROP TABLE IF EXISTS invoices CASCADE',
      'DROP TABLE IF EXISTS "ScheduledTasks" CASCADE',
      'DROP TABLE IF EXISTS customers CASCADE'
    ];
    
    for (const drop of dropTables) {
      await client.query(drop);
    }
    
    // Create clean tables (only useful columns)
    console.log('📋 Creating clean tables...');
    
    // 1. customers table - only useful columns
    await client.query(`
      CREATE TABLE customers (
        "CustomerID" TEXT PRIMARY KEY,
        "Name" TEXT,
        "Villa" TEXT,
        "Phone" TEXT,
        "Number of car" INTEGER,
        "CarPlates" TEXT,
        "Days" TEXT,
        "Time" TEXT,
        "Notes" TEXT,
        "Washman_Package" TEXT,
        "Fee" INTEGER,
        "start date" TEXT,
        "payment" TEXT,
        "Status" TEXT,
        "Serves" TEXT,
        "Serves Active" TEXT,
        "Car A" TEXT,
        "Car B" TEXT,
        "Car C" TEXT
      )
    `);
    console.log('✅ customers table created (clean)');
    
    // 2. ScheduledTasks table - only useful columns
    await client.query(`
      CREATE TABLE "ScheduledTasks" (
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
        "isLocked" TEXT,
        "ScheduleDate" TEXT
      )
    `);
    console.log('✅ ScheduledTasks table created (clean)');
    
    // 3. invoices table
    await client.query(`
      CREATE TABLE invoices (
        "InvoiceID" TEXT PRIMARY KEY,
        "CustomerID" TEXT,
        "CustomerName" TEXT,
        "Villa" TEXT,
        "DueDate" TEXT,
        "TotalAmount" INTEGER,
        "Status" TEXT,
        "PaymentMethod" TEXT,
        "Start" TEXT,
        "End" TEXT,
        "Vehicle" TEXT,
        "PackageID" TEXT,
        "Notes" TEXT,
        "CreatedBy" TEXT,
        "CreatedAt" TEXT,
        "Ref" TEXT,
        "Services" TEXT
      )
    `);
    console.log('✅ invoices table created');
    
    // 4. Workers table
    await client.query(`
      CREATE TABLE "Workers" (
        "WorkerID" TEXT,
        "Name" TEXT,
        "Job" TEXT,
        "Status" TEXT
      )
    `);
    console.log('✅ Workers table created');
    
    // 5. wash_history table
    await client.query(`
      CREATE TABLE wash_history (
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
      )
    `);
    console.log('✅ wash_history table created');
    
    // 6. Users table
    await client.query(`
      CREATE TABLE "Users" (
        "UserID" TEXT PRIMARY KEY,
        "Username" TEXT,
        "Password" TEXT,
        "Role" TEXT,
        "Status" TEXT
      )
    `);
    console.log('✅ Users table created');
    
    // 7. Services table
    await client.query(`
      CREATE TABLE "Services" (
        "ServiceID" TEXT,
        "ServiceName" TEXT,
        "Status" TEXT
      )
    `);
    console.log('✅ Services table created');
    
    // 8. WashRules table - only useful columns
    await client.query(`
      CREATE TABLE "WashRules" (
        "RuleId" TEXT PRIMARY KEY,
        "RuleName" TEXT,
        "SingleCarPattern" TEXT,
        "MultiCarSettings" TEXT,
        "BiWeeklySettings" TEXT,
        "CreatedDate" TEXT,
        "Status" TEXT
      )
    `);
    console.log('✅ WashRules table created (clean)');
    
    // 9. assignments table
    await client.query(`
      CREATE TABLE assignments (
        "taskId" TEXT PRIMARY KEY,
        "customerName" TEXT,
        "carPlate" TEXT,
        "washDay" TEXT,
        "washTime" TEXT,
        "washType" TEXT,
        "assignedWorker" TEXT,
        "villa" TEXT,
        "isLocked" TEXT,
        "scheduleDate" TEXT
      )
    `);
    console.log('✅ assignments table created');
    
    // 10. ScheduleAuditLog table
    await client.query(`
      CREATE TABLE "ScheduleAuditLog" (
        "LogID" TEXT PRIMARY KEY,
        "Timestamp" TEXT,
        "UserID" TEXT,
        "UserName" TEXT,
        "Action" TEXT,
        "CustomerID" TEXT,
        "CustomerName" TEXT,
        "Villa" TEXT,
        "CarPlate" TEXT,
        "Day" TEXT,
        "Time" TEXT,
        "OldWorker" TEXT,
        "NewWorker" TEXT,
        "OldWashType" TEXT,
        "NewWashType" TEXT,
        "ChangeReason" TEXT
      )
    `);
    console.log('✅ ScheduleAuditLog table created');
    
    // 11. deleted_invoices table
    await client.query(`
      CREATE TABLE deleted_invoices (
        "InvoiceID" TEXT,
        "Ref" TEXT,
        "CustomerID" TEXT,
        "CustomerName" TEXT,
        "Villa" TEXT,
        "InvoiceDate" TEXT,
        "DueDate" TEXT,
        "TotalAmount" INTEGER,
        "Status" TEXT,
        "PaymentMethod" TEXT,
        "Notes" TEXT,
        "CreatedBy" TEXT,
        "CreatedAt" TEXT,
        "DeletedAt" TEXT,
        "DeletedBy" TEXT
      )
    `);
    console.log('✅ deleted_invoices table created');
    
    console.log('');
    console.log('🎉 Clean schema created successfully!');
    console.log('✅ No empty field columns');
    console.log('✅ Only useful columns included');
    console.log('✅ Ready for clean data migration');
    
  } catch (error) {
    console.error('❌ Error creating schema:', error);
  } finally {
    await client.end();
  }
}

// Run if called directly
if (require.main === module) {
  createCleanSupabaseSchema();
}

module.exports = { createCleanSupabaseSchema };