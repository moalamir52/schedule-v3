// Migrate data with exact column matching
const { Client } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const SUPABASE_URL = 'postgresql://postgres:[YOUR_PASSWORD]@db.gtbtlslrhifwjpzukfmt.supabase.co:5432/postgres';

async function migrateDataExact() {
  console.log('📦 Migrating Data with Exact Column Matching');
  console.log('============================================');
  
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
    // Tables to migrate with exact names
    const tablesToMigrate = [
      'customers',
      'ScheduledTasks', 
      'invoices',
      'Workers',
      'wash_history',
      'Users',
      'Services',
      'WashRules',
      'assignments',
      'ScheduleAuditLog',
      'deleted_invoices'
    ];
    
    for (const tableName of tablesToMigrate) {
      console.log(`📦 Migrating ${tableName}...`);
      
      // Get data from SQLite
      const sqliteData = await new Promise((resolve, reject) => {
        sqlite.all(`SELECT * FROM ${tableName}`, (err, rows) => {
          if (err) {
            console.log(`   ⚠️  Table ${tableName} not found, skipping...`);
            resolve([]);
          } else {
            resolve(rows || []);
          }
        });
      });
      
      if (sqliteData.length === 0) {
        console.log(`   📭 No data in ${tableName}`);
        continue;
      }
      
      console.log(`   📊 Found ${sqliteData.length} records`);
      
      // Clear existing data in Supabase
      const tableNameForQuery = ['ScheduledTasks', 'Users', 'Services', 'WashRules', 'Workers', 'ScheduleAuditLog'].includes(tableName) 
        ? `"${tableName}"` 
        : tableName;
      
      await supabase.query(`DELETE FROM ${tableNameForQuery}`);
      console.log(`   🗑️  Cleared existing data`);
      
      // Insert data into Supabase
      let successCount = 0;
      let errorCount = 0;
      
      for (const row of sqliteData) {
        try {
          const columns = Object.keys(row).map(col => `"${col}"`).join(', ');
          const values = Object.values(row);
          const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
          
          const query = `INSERT INTO ${tableNameForQuery} (${columns}) VALUES (${placeholders})`;
          await supabase.query(query, values);
          successCount++;
        } catch (error) {
          errorCount++;
          if (errorCount <= 3) { // Show first 3 errors only
            console.log(`   ⚠️  Error inserting row: ${error.message}`);
          }
        }
      }
      
      console.log(`   ✅ Successfully migrated: ${successCount} records`);
      if (errorCount > 0) {
        console.log(`   ⚠️  Errors: ${errorCount} records`);
      }
    }
    
    // Add default workers if Workers table is empty
    const workersResult = await supabase.query('SELECT COUNT(*) FROM "Workers"');
    if (parseInt(workersResult.rows[0].count) === 0) {
      console.log('👥 Adding default workers...');
      
      const defaultWorkers = [
        { WorkerID: 'WORKER-001', Name: 'Ahmed', Job: 'Car Washer', Status: 'Active' },
        { WorkerID: 'WORKER-002', Name: 'Mohamed', Job: 'Car Washer', Status: 'Active' },
        { WorkerID: 'WORKER-003', Name: 'Ali', Job: 'Car Washer', Status: 'Active' },
        { WorkerID: 'WORKER-004', Name: 'Omar', Job: 'Car Washer', Status: 'Active' },
        { WorkerID: 'WORKER-005', Name: 'Khaled', Job: 'Car Washer', Status: 'Active' }
      ];
      
      for (const worker of defaultWorkers) {
        await supabase.query(
          'INSERT INTO "Workers" ("WorkerID", "Name", "Job", "Status") VALUES ($1, $2, $3, $4)',
          [worker.WorkerID, worker.Name, worker.Job, worker.Status]
        );
      }
      console.log('   ✅ Added 5 default workers');
    }
    
    // Verify migration
    console.log('');
    console.log('🔍 Verifying migration...');
    for (const tableName of tablesToMigrate) {
      try {
        const tableNameForQuery = ['ScheduledTasks', 'Users', 'Services', 'WashRules', 'Workers', 'ScheduleAuditLog'].includes(tableName) 
          ? `"${tableName}"` 
          : tableName;
        
        const result = await supabase.query(`SELECT COUNT(*) FROM ${tableNameForQuery}`);
        console.log(`   ${tableName}: ${result.rows[0].count} records`);
      } catch (error) {
        console.log(`   ${tableName}: Error - ${error.message}`);
      }
    }
    
    console.log('');
    console.log('🎉 Migration completed successfully!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Update DATABASE_URL in Render environment variables');
    console.log('2. Deploy the application');
    console.log('3. Test all functionality');
    console.log('');
    console.log('🔗 Your Supabase URL (replace [YOUR_PASSWORD]):');
    console.log(SUPABASE_URL);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await supabase.end();
    sqlite.close();
  }
}

// Run migration
if (require.main === module) {
  migrateDataExact();
}

module.exports = { migrateDataExact };