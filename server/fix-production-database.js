const { Client } = require('pg');

async function fixProductionDatabase() {
  console.log('🔧 Production Database Fix Script');
  console.log('=================================');
  
  // Check if we have DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found!');
    console.log('Please set DATABASE_URL in your Render environment variables');
    return;
  }
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('🐘 Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected successfully!');
    
    // Check if tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    const result = await client.query(tablesQuery);
    const existingTables = result.rows.map(row => row.table_name);
    
    console.log('📋 Existing tables:', existingTables);
    
    // Required tables
    const requiredTables = ['customers', 'workers', 'wash_history', 'scheduledtasks'];
    const missingTables = requiredTables.filter(table => 
      !existingTables.some(existing => existing.toLowerCase() === table.toLowerCase())
    );
    
    if (missingTables.length > 0) {
      console.log('❌ Missing tables:', missingTables);
      console.log('🔧 Creating missing tables...');
      
      // Create missing tables
      const createQueries = {
        customers: `
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
        `,
        workers: `
          CREATE TABLE IF NOT EXISTS workers (
            "WorkerID" TEXT,
            "Name" TEXT NOT NULL,
            "Phone" TEXT,
            "Status" TEXT DEFAULT 'Active',
            "Specialization" TEXT,
            "HourlyRate" DECIMAL
          );
        `,
        wash_history: `
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
        `,
        scheduledtasks: `
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
      };
      
      for (const table of missingTables) {
        if (createQueries[table.toLowerCase()]) {
          console.log(`🔧 Creating table: ${table}`);
          await client.query(createQueries[table.toLowerCase()]);
          console.log(`✅ Table ${table} created successfully`);
        }
      }
    } else {
      console.log('✅ All required tables exist');
    }
    
    // Test basic operations
    console.log('🧪 Testing basic operations...');
    
    // Test customers table
    try {
      const customersResult = await client.query('SELECT COUNT(*) as count FROM customers');
      console.log(`✅ Customers table: ${customersResult.rows[0].count} records`);
    } catch (error) {
      console.error('❌ Customers table error:', error.message);
    }
    
    // Test workers table
    try {
      const workersResult = await client.query('SELECT COUNT(*) as count FROM workers');
      console.log(`✅ Workers table: ${workersResult.rows[0].count} records`);
    } catch (error) {
      console.error('❌ Workers table error:', error.message);
    }
    
    // Test ScheduledTasks table
    try {
      const tasksResult = await client.query('SELECT COUNT(*) as count FROM "ScheduledTasks"');
      console.log(`✅ ScheduledTasks table: ${tasksResult.rows[0].count} records`);
    } catch (error) {
      console.error('❌ ScheduledTasks table error:', error.message);
    }
    
    console.log('🎉 Database fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Database fix failed:', error);
    console.error('Error details:', error.message);
    
    // Provide specific guidance
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Connection refused - check if PostgreSQL server is running');
    } else if (error.code === '28P01') {
      console.log('💡 Authentication failed - check DATABASE_URL credentials');
    } else if (error.code === '3D000') {
      console.log('💡 Database does not exist - check DATABASE_URL database name');
    }
    
  } finally {
    await client.end();
  }
}

// Run if called directly
if (require.main === module) {
  fixProductionDatabase();
}

module.exports = { fixProductionDatabase };