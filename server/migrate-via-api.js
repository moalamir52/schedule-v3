// Migrate data using Supabase REST API
const sqlite3 = require('sqlite3').verbose();
const https = require('https');
const path = require('path');

const SUPABASE_URL = 'https://gtbtlslrhifwjpzukfmt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0YnRsc2xyaGlmd2pwenVrZm10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NzYzMDksImV4cCI6MjA3ODI1MjMwOX0.VjYOwxkzoLtb_ywBV40S8cA0XUqxtGcDtNGcVz-UgvM';

async function migrateData() {
  console.log('🚀 Migrating Data to Supabase');
  console.log('============================');
  
  const dbPath = path.join(__dirname, 'database', 'database.db');
  console.log('📂 Database path:', dbPath);
  const db = new sqlite3.Database(dbPath);
  
  try {
    // Get actual table names first
    const tables = await getTableNames(db);
    console.log('📋 Found tables:', tables);
    
    // Migrate customers
    if (tables.includes('customers')) {
      console.log('📋 Migrating customers...');
      await migrateTable(db, 'customers', [
        'CustomerID', 'Name', 'Villa', 'Phone', 'Number of car', 'CarPlates',
        'Days', 'Time', 'Notes', 'Washman_Package', 'Fee', 'start date',
        'payment', 'Status', 'Serves', 'Serves Active', 'Car A', 'Car B', 'Car C'
      ]);
    }
    
    // Migrate Workers
    if (tables.includes('Workers')) {
      console.log('👷 Migrating Workers...');
      await migrateTable(db, 'Workers', ['WorkerID', 'Name', 'Job', 'Status']);
    }
    
    // Migrate wash_history
    if (tables.includes('wash_history')) {
      console.log('🧼 Migrating wash_history...');
      await migrateTable(db, 'wash_history', [
        'WashID', 'CustomerID', 'CarPlate', 'WashDate', 'PackageType',
        'Villa', 'WashTypePerformed', 'VisitNumberInWeek', 'WeekInCycle',
        'Status', 'WorkerName'
      ]);
    }
    
    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    db.close();
  }
}

function migrateTable(db, tableName, columns) {
  return new Promise((resolve, reject) => {
    const columnStr = columns.map(col => `"${col}"`).join(', ');
    const query = `SELECT ${columnStr} FROM "${tableName}"`;
    
    db.all(query, async (err, rows) => {
      if (err) {
        console.log(`❌ Error reading ${tableName}:`, err.message);
        resolve();
        return;
      }
      
      if (rows.length === 0) {
        console.log(`📭 ${tableName}: No data to migrate`);
        resolve();
        return;
      }
      
      try {
        // Clean data (remove null/empty values)
        const cleanRows = rows.map(row => {
          const cleanRow = {};
          for (const [key, value] of Object.entries(row)) {
            if (value !== null && value !== '') {
              cleanRow[key] = value;
            }
          }
          return cleanRow;
        });
        
        // Insert to Supabase
        await insertToSupabase(tableName, cleanRows);
        console.log(`✅ ${tableName}: ${cleanRows.length} records migrated`);
        resolve();
        
      } catch (error) {
        console.error(`❌ ${tableName} migration failed:`, error.message);
        reject(error);
      }
    });
  });
}

function insertToSupabase(tableName, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'gtbtlslrhifwjpzukfmt.supabase.co',
      port: 443,
      path: `/rest/v1/${tableName}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=minimal',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

// Run migration
if (require.main === module) {
  migrateData();
}

function getTableNames(db) {
  return new Promise((resolve, reject) => {
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows.map(row => row.name));
      }
    });
  });
}

module.exports = { migrateData };