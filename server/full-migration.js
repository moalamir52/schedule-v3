// Complete migration to Supabase
const sqlite3 = require('sqlite3').verbose();
const https = require('https');
const path = require('path');

const SUPABASE_URL = 'https://gtbtlslrhifwjpzukfmt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0YnRsc2xyaGlmd2pwenVrZm10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NzYzMDksImV4cCI6MjA3ODI1MjMwOX0.VjYOwxkzoLtb_ywBV40S8cA0XUqxtGcDtNGcVz-UgvM';

async function fullMigration() {
  console.log('🚀 Full Migration to Supabase');
  console.log('=============================');
  
  const dbPath = path.join(__dirname, 'database', 'database.db');
  const db = new sqlite3.Database(dbPath);
  
  try {
    // 1. Migrate Workers
    await migrateWorkers(db);
    
    // 2. Migrate customers
    await migrateCustomers(db);
    
    // 3. Migrate wash_history
    await migrateWashHistory(db);
    
    console.log('\n🎉 Full migration completed!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    db.close();
  }
}

function migrateWorkers(db) {
  return new Promise((resolve, reject) => {
    console.log('\n👷 Migrating Workers...');
    
    db.all('SELECT * FROM Workers', async (err, rows) => {
      if (err) {
        console.error('❌ Error reading Workers:', err);
        resolve();
        return;
      }
      
      if (rows.length === 0) {
        console.log('📭 No Workers data');
        resolve();
        return;
      }
      
      const cleanRows = rows.map(row => ({
        WorkerID: row.WorkerID || null,
        Name: row.Name || null,
        Job: row.Job || null,
        Status: row.Status || null
      })).filter(row => row.WorkerID); // Only rows with WorkerID
      
      try {
        await insertToSupabase('Workers', cleanRows);
        console.log(`✅ Workers: ${cleanRows.length} records migrated`);
        resolve();
      } catch (error) {
        console.error('❌ Workers migration failed:', error.message);
        resolve();
      }
    });
  });
}

function migrateCustomers(db) {
  return new Promise((resolve, reject) => {
    console.log('\n📋 Migrating customers...');
    
    db.all('SELECT * FROM customers', async (err, rows) => {
      if (err) {
        console.error('❌ Error reading customers:', err);
        resolve();
        return;
      }
      
      if (rows.length === 0) {
        console.log('📭 No customers data');
        resolve();
        return;
      }
      
      const cleanRows = rows.map(row => ({
        CustomerID: row.CustomerID || null,
        Name: row.Name || null,
        Villa: row.Villa || null,
        Phone: row.Phone || null,
        'Number of car': row['Number of car'] || null,
        CarPlates: row.CarPlates || null,
        Days: row.Days || null,
        Time: row.Time || null,
        Notes: row.Notes || null,
        Washman_Package: row.Washman_Package || null,
        Fee: row.Fee || null,
        'start date': row['start date'] || null,
        payment: row.payment || null,
        Status: row.Status || null,
        Serves: row.Serves || null,
        'Serves Active': row['Serves Active'] || null,
        'Car A': row['Car A'] || null,
        'Car B': row['Car B'] || null,
        'Car C': row['Car C'] || null
      })).filter(row => row.CustomerID); // Only rows with CustomerID
      
      try {
        await insertToSupabase('customers', cleanRows);
        console.log(`✅ customers: ${cleanRows.length} records migrated`);
        resolve();
      } catch (error) {
        console.error('❌ customers migration failed:', error.message);
        resolve();
      }
    });
  });
}

function migrateWashHistory(db) {
  return new Promise((resolve, reject) => {
    console.log('\n🧼 Migrating wash_history...');
    
    db.all('SELECT * FROM wash_history', async (err, rows) => {
      if (err) {
        console.error('❌ Error reading wash_history:', err);
        resolve();
        return;
      }
      
      if (rows.length === 0) {
        console.log('📭 No wash_history data');
        resolve();
        return;
      }
      
      const cleanRows = rows.map(row => ({
        WashID: row.WashID || null,
        CustomerID: row.CustomerID || null,
        CarPlate: row.CarPlate || null,
        WashDate: row.WashDate || null,
        PackageType: row.PackageType || null,
        Villa: row.Villa || null,
        WashTypePerformed: row.WashTypePerformed || null,
        VisitNumberInWeek: row.VisitNumberInWeek || null,
        WeekInCycle: row.WeekInCycle || null,
        Status: row.Status || null,
        WorkerName: row.WorkerName || null
      })).filter(row => row.WashID); // Only rows with WashID
      
      try {
        await insertToSupabase('wash_history', cleanRows);
        console.log(`✅ wash_history: ${cleanRows.length} records migrated`);
        resolve();
      } catch (error) {
        console.error('❌ wash_history migration failed:', error.message);
        resolve();
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

fullMigration();