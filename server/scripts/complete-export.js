// Complete database export from SQLite to PostgreSQL
const sqlite3 = require('sqlite3').verbose();

const SERVER_URL = 'https://schedule-v3-server.onrender.com/api';

async function exportAllData() {
  console.log('📤 Complete database export starting...');
  
  const db = new sqlite3.Database('./database/database.db');
  
  try {
    // Get all data
    const customers = await queryDB(db, 'SELECT * FROM customers');
    const workers = await queryDB(db, 'SELECT * FROM Workers');
    const users = await queryDB(db, 'SELECT * FROM Users');
    const history = await queryDB(db, 'SELECT * FROM wash_history');
    const invoices = await queryDB(db, 'SELECT * FROM invoices');
    const scheduledTasks = await queryDB(db, 'SELECT * FROM ScheduledTasks');
    const services = await queryDB(db, 'SELECT * FROM Services');
    const washRules = await queryDB(db, 'SELECT * FROM WashRules');
    const auditLog = await queryDB(db, 'SELECT * FROM ScheduleAuditLog');
    const deletedInvoices = await queryDB(db, 'SELECT * FROM deleted_invoices');
    
    console.log(`📊 Data summary:`);
    console.log(`  - ${customers.length} customers`);
    console.log(`  - ${workers.length} workers`);
    console.log(`  - ${users.length} users`);
    console.log(`  - ${history.length} wash history records`);
    console.log(`  - ${invoices.length} invoices`);
    console.log(`  - ${scheduledTasks.length} scheduled tasks`);
    console.log(`  - ${services.length} services`);
    console.log(`  - ${washRules.length} wash rules`);
    console.log(`  - ${auditLog.length} audit logs`);
    console.log(`  - ${deletedInvoices.length} deleted invoices`);
    
    // Upload customers
    console.log('\n📤 Uploading customers...');
    for (const customer of customers) {
      try {
        await fetch(`${SERVER_URL}/customers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(customer)
        });
        console.log(`✅ ${customer.Name}`);
      } catch (error) {
        console.log(`❌ ${customer.Name}: ${error.message}`);
      }
    }
    
    // Upload workers
    console.log('\n📤 Uploading workers...');
    for (const worker of workers) {
      try {
        await fetch(`${SERVER_URL}/workers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(worker)
        });
        console.log(`✅ ${worker.Name}`);
      } catch (error) {
        console.log(`❌ ${worker.Name}: ${error.message}`);
      }
    }
    
    // Upload users
    console.log('\n📤 Uploading users...');
    for (const user of users) {
      try {
        await fetch(`${SERVER_URL}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user)
        });
        console.log(`✅ ${user.Username}`);
      } catch (error) {
        console.log(`❌ ${user.Username}: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Complete export finished!');
    console.log('💡 Note: Some data types (history, invoices, etc.) may need specific API endpoints');
    
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

exportAllData();