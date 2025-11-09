// Migrate only useful data (skip empty field columns)
const { Client } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const SUPABASE_URL = 'postgresql://postgres:[YOUR_PASSWORD]@db.gtbtlslrhifwjpzukfmt.supabase.co:5432/postgres';

async function migrateCleanData() {
  console.log('🧹 Migrating Clean Data (No Empty Fields)');
  console.log('==========================================');
  
  const supabase = new Client({
    connectionString: SUPABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  await supabase.connect();
  console.log('✅ Connected to Supabase');
  
  const dbPath = path.join(__dirname, 'database', 'database.db');
  const sqlite = new sqlite3.Database(dbPath);
  console.log('✅ Connected to SQLite');
  
  try {
    // Define useful columns for each table (skip field1, field2, etc.)
    const tableColumns = {
      customers: [
        'CustomerID', 'Name', 'Villa', 'Phone', 'Number of car', 'CarPlates',
        'Days', 'Time', 'Notes', 'Washman_Package', 'Fee', 'start date',
        'payment', 'Status', 'Serves', 'Serves Active', 'Car A', 'Car B', 'Car C'
      ],
      ScheduledTasks: [
        'Day', 'AppointmentDate', 'Time', 'CustomerID', 'CustomerName', 'Villa',
        'CarPlate', 'WashType', 'WorkerName', 'WorkerID', 'PackageType', 'isLocked', 'ScheduleDate'
      ],
      invoices: [
        'InvoiceID', 'CustomerID', 'CustomerName', 'Villa', 'DueDate', 'TotalAmount',
        'Status', 'PaymentMethod', 'Start', 'End', 'Vehicle', 'PackageID',
        'Notes', 'CreatedBy', 'CreatedAt', 'Ref', 'Services'
      ],
      Workers: ['WorkerID', 'Name', 'Job', 'Status'],
      wash_history: [
        'WashID', 'CustomerID', 'CarPlate', 'WashDate', 'PackageType', 'Villa',
        'WashTypePerformed', 'VisitNumberInWeek', 'WeekInCycle', 'Status', 'WorkerName'
      ],
      Users: ['UserID', 'Username', 'Password', 'Role', 'Status'],
      Services: ['ServiceID', 'ServiceName', 'Status'],
      WashRules: [
        'RuleId', 'RuleName', 'SingleCarPattern', 'MultiCarSettings',
        'BiWeeklySettings', 'CreatedDate', 'Status'
      ],
      assignments: [
        'taskId', 'customerName', 'carPlate', 'washDay', 'washTime',
        'washType', 'assignedWorker', 'villa', 'isLocked', 'scheduleDate'
      ],
      ScheduleAuditLog: [
        'LogID', 'Timestamp', 'UserID', 'UserName', 'Action', 'CustomerID',
        'CustomerName', 'Villa', 'CarPlate', 'Day', 'Time', 'OldWorker',
        'NewWorker', 'OldWashType', 'NewWashType', 'ChangeReason'
      ],
      deleted_invoices: [
        'InvoiceID', 'Ref', 'CustomerID', 'CustomerName', 'Villa', 'InvoiceDate',
        'DueDate', 'TotalAmount', 'Status', 'PaymentMethod', 'Notes',
        'CreatedBy', 'CreatedAt', 'DeletedAt', 'DeletedBy'
      ]
    };
    
    for (const [tableName, columns] of Object.entries(tableColumns)) {
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
      
      // Clear existing data
      const tableNameForQuery = ['ScheduledTasks', 'Users', 'Services', 'WashRules', 'Workers', 'ScheduleAuditLog'].includes(tableName) 
        ? `"${tableName}"` 
        : tableName;
      
      await supabase.query(`DELETE FROM ${tableNameForQuery}`);
      
      // Insert only useful columns
      let successCount = 0;
      let errorCount = 0;
      
      for (const row of sqliteData) {
        try {
          // Filter only useful columns
          const cleanRow = {};
          columns.forEach(col => {
            if (row.hasOwnProperty(col)) {
              cleanRow[col] = row[col];
            }
          });
          
          if (Object.keys(cleanRow).length === 0) continue;
          
          const columnNames = Object.keys(cleanRow).map(col => `"${col}"`).join(', ');
          const values = Object.values(cleanRow);
          const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
          
          const query = `INSERT INTO ${tableNameForQuery} (${columnNames}) VALUES (${placeholders})`;
          await supabase.query(query, values);
          successCount++;
        } catch (error) {
          errorCount++;
          if (errorCount <= 2) {
            console.log(`   ⚠️  Error: ${error.message}`);
          }
        }
      }
      
      console.log(`   ✅ Migrated: ${successCount} records`);
      if (errorCount > 0) {
        console.log(`   ⚠️  Errors: ${errorCount} records`);
      }
    }
    
    // Add default workers
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
    
    console.log('');
    console.log('🎉 Clean migration completed!');
    console.log('✅ No empty field columns migrated');
    console.log('✅ Only useful data transferred');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await supabase.end();
    sqlite.close();
  }
}

if (require.main === module) {
  migrateCleanData();
}

module.exports = { migrateCleanData };