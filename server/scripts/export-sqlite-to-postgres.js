// Export SQLite database to PostgreSQL
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const SERVER_URL = 'https://schedule-v3-server.onrender.com/api';

async function exportFromSQLite(dbPath) {
  console.log(`📤 Exporting from SQLite: ${dbPath}`);
  
  const db = new sqlite3.Database(dbPath);
  
  try {
    // Get customers
    const customers = await queryDB(db, 'SELECT * FROM customers');
    console.log(`👥 Found ${customers.length} customers`);
    
    // Get workers
    const workers = await queryDB(db, 'SELECT * FROM workers');
    console.log(`👷 Found ${workers.length} workers`);
    
    // Get users
    const users = await queryDB(db, 'SELECT * FROM Users');
    console.log(`👥 Found ${users.length} users`);
    
    // Get history
    const history = await queryDB(db, 'SELECT * FROM wash_history');
    console.log(`📝 Found ${history.length} history records`);
    
    // Get invoices
    const invoices = await queryDB(db, 'SELECT * FROM invoices');
    console.log(`📄 Found ${invoices.length} invoices`);
    
    // Get all other tables
    const scheduledTasks = await queryDB(db, 'SELECT * FROM ScheduledTasks').catch(() => []);
    console.log(`📅 Found ${scheduledTasks.length} scheduled tasks`);
    
    const services = await queryDB(db, 'SELECT * FROM Services').catch(() => []);
    console.log(`🔧 Found ${services.length} services`);
    
    const washRules = await queryDB(db, 'SELECT * FROM WashRules').catch(() => []);
    console.log(`📋 Found ${washRules.length} wash rules`);
    
    const assignments = await queryDB(db, 'SELECT * FROM assignments').catch(() => []);
    console.log(`📝 Found ${assignments.length} assignments`);
    
    // Upload customers
    for (const customer of customers) {
      try {
        const response = await fetch(`${SERVER_URL}/customers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(customer)
        });
        
        if (response.ok) {
          console.log(`✅ Customer: ${customer.Name || customer.CustomerName}`);
        } else {
          console.log(`⚠️  Failed: ${customer.Name || customer.CustomerName}`);
        }
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
      }
    }
    
    // Upload workers
    for (const worker of workers) {
      try {
        const response = await fetch(`${SERVER_URL}/workers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(worker)
        });
        
        if (response.ok) {
          console.log(`✅ Worker: ${worker.Name}`);
        }
      } catch (error) {
        console.log(`❌ Worker error: ${error.message}`);
      }
    }
    
    // Upload users
    for (const user of users) {
      try {
        const response = await fetch(`${SERVER_URL}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user)
        });
        
        if (response.ok) {
          console.log(`✅ User: ${user.Username}`);
        }
      } catch (error) {
        console.log(`❌ User error: ${error.message}`);
      }
    }
    
    console.log('🎉 Export completed!');
    console.log(`📊 Summary:`);
    console.log(`  - ${customers.length} customers`);
    console.log(`  - ${workers.length} workers`);
    console.log(`  - ${users.length} users`);
    console.log(`  - ${history.length} history records`);
    console.log(`  - ${invoices.length} invoices`);
    console.log(`  - ${scheduledTasks.length} scheduled tasks`);
    console.log(`  - ${services.length} services`);
    console.log(`  - ${washRules.length} wash rules`);
    console.log(`  - ${assignments.length} assignments`);
    
  } catch (error) {
    console.error('❌ Export failed:', error.message);
  } finally {
    db.close();
  }
}

function queryDB(db, sql) {
  return new Promise((resolve, reject) => {
    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

// Usage
const dbPath = process.argv[2] || './database/database.db';
exportFromSQLite(dbPath);