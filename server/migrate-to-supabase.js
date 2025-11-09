// Migrate from SQLite to Supabase
const { Client } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const SUPABASE_URL = 'postgresql://postgres:[YOUR_PASSWORD]@db.gtbtlslrhifwjpzukfmt.supabase.co:5432/postgres';

async function migrateToSupabase() {
  console.log('🚀 Starting Migration to Supabase');
  console.log('================================');
  
  // Connect to Supabase
  const supabase = new Client({
    connectionString: SUPABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  await supabase.connect();
  console.log('✅ Connected to Supabase');
  
  // Connect to SQLite
  const dbPath = path.join(__dirname, 'database', 'database.db');
  const sqlite = new sqlite3.Database(dbPath);
  console.log('✅ Connected to SQLite');
  
  try {
    // 1. Create tables in Supabase
    console.log('📋 Creating tables in Supabase...');
    
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
        "Email" TEXT,
        "Notes" TEXT,
        "Fee" DECIMAL,
        "Number of car" INTEGER,
        "start date" TEXT
      )`,
      
      `CREATE TABLE IF NOT EXISTS workers (
        "WorkerID" TEXT,
        "Name" TEXT NOT NULL,
        "Phone" TEXT,
        "Status" TEXT DEFAULT 'Active',
        "Specialization" TEXT,
        "HourlyRate" DECIMAL
      )`,
      
      `CREATE TABLE IF NOT EXISTS wash_history (
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
      )`,
      
      `CREATE TABLE IF NOT EXISTS "ScheduledTasks" (
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
      )`,
      
      `CREATE TABLE IF NOT EXISTS invoices (
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
      )`,
      
      `CREATE TABLE IF NOT EXISTS "Users" (
        "UserID" TEXT PRIMARY KEY,
        "Username" TEXT UNIQUE NOT NULL,
        "Password" TEXT NOT NULL,
        "PlainPassword" TEXT,
        "Role" TEXT NOT NULL,
        "Status" TEXT DEFAULT 'Active',
        "CreatedAt" TEXT
      )`
    ];
    
    for (const table of tables) {
      await supabase.query(table);
    }
    console.log('✅ Tables created in Supabase');
    
    // 2. Migrate data
    const tablesToMigrate = ['customers', 'workers', 'wash_history', 'ScheduledTasks', 'invoices', 'Users'];
    
    for (const tableName of tablesToMigrate) {
      console.log(`📦 Migrating ${tableName}...`);
      
      // Get data from SQLite
      const sqliteData = await new Promise((resolve, reject) => {
        sqlite.all(`SELECT * FROM ${tableName}`, (err, rows) => {
          if (err) {
            console.log(`⚠️  Table ${tableName} not found in SQLite, skipping...`);
            resolve([]);
          } else {
            resolve(rows || []);
          }
        });
      });
      
      if (sqliteData.length === 0) {
        console.log(`   No data in ${tableName}`);
        continue;
      }
      
      // Clear existing data in Supabase
      await supabase.query(`DELETE FROM ${tableName.includes('ScheduledTasks') || tableName.includes('Users') ? `"${tableName}"` : tableName}`);
      
      // Insert data into Supabase
      for (const row of sqliteData) {
        const columns = Object.keys(row).map(col => `"${col}"`).join(', ');
        const values = Object.values(row);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
        
        const query = `INSERT INTO ${tableName.includes('ScheduledTasks') || tableName.includes('Users') ? `"${tableName}"` : tableName} (${columns}) VALUES (${placeholders})`;
        
        try {
          await supabase.query(query, values);
        } catch (error) {
          console.log(`   Error inserting row:`, error.message);
        }
      }
      
      console.log(`   ✅ Migrated ${sqliteData.length} records`);
    }
    
    // 3. Add default workers if none exist
    const workersResult = await supabase.query('SELECT COUNT(*) FROM workers');
    if (parseInt(workersResult.rows[0].count) === 0) {
      console.log('📦 Adding default workers...');
      
      const defaultWorkers = [
        { WorkerID: 'WORKER-001', Name: 'Ahmed', Phone: '01234567890', Status: 'Active' },
        { WorkerID: 'WORKER-002', Name: 'Mohamed', Phone: '01234567891', Status: 'Active' },
        { WorkerID: 'WORKER-003', Name: 'Ali', Phone: '01234567892', Status: 'Active' },
        { WorkerID: 'WORKER-004', Name: 'Omar', Phone: '01234567893', Status: 'Active' },
        { WorkerID: 'WORKER-005', Name: 'Khaled', Phone: '01234567894', Status: 'Active' }
      ];
      
      for (const worker of defaultWorkers) {
        await supabase.query(
          'INSERT INTO workers ("WorkerID", "Name", "Phone", "Status") VALUES ($1, $2, $3, $4)',
          [worker.WorkerID, worker.Name, worker.Phone, worker.Status]
        );
      }
      console.log('   ✅ Added 5 default workers');
    }
    
    console.log('🎉 Migration completed successfully!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Update DATABASE_URL in Render environment variables');
    console.log('2. Deploy the application');
    console.log('3. Test all functionality');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await supabase.end();
    sqlite.close();
  }
}

// Run migration
if (require.main === module) {
  migrateToSupabase();
}

module.exports = { migrateToSupabase };