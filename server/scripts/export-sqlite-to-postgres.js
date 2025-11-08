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
    
    console.log('🎉 Export completed!');
    
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