const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, 'database/database.db');

console.log('🔧 Fixing invoices table...');

// Connect to existing database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Error connecting to database:', err);
    return;
  }
  console.log('✅ Connected to database');
  
  // Drop and recreate invoices table with correct schema
  db.serialize(() => {
    db.run('DROP TABLE IF EXISTS invoices', (err) => {
      if (err) {
        console.error('❌ Error dropping invoices table:', err);
        return;
      }
      console.log('✅ Dropped old invoices table');
      
      // Create new invoices table
      const createTableSQL = `
        CREATE TABLE invoices (
          InvoiceID TEXT PRIMARY KEY COLLATE NOCASE,
          Ref TEXT UNIQUE COLLATE NOCASE,
          CustomerID TEXT COLLATE NOCASE,
          CustomerName TEXT COLLATE NOCASE,
          Villa TEXT COLLATE NOCASE,
          InvoiceDate TEXT,
          DueDate TEXT,
          TotalAmount REAL,
          Status TEXT DEFAULT 'Pending' COLLATE NOCASE,
          PaymentMethod TEXT COLLATE NOCASE,
          Start TEXT,
          End TEXT,
          Vehicle TEXT COLLATE NOCASE,
          PackageID TEXT COLLATE NOCASE,
          Services TEXT,
          Notes TEXT,
          CreatedBy TEXT COLLATE NOCASE,
          CreatedAt TEXT,
          SubTotal REAL,
          Phone TEXT,
          Payment TEXT,
          Subject TEXT
        )
      `;
      
      db.run(createTableSQL, (err) => {
        if (err) {
          console.error('❌ Error creating invoices table:', err);
          return;
        }
        console.log('✅ Created new invoices table');
        
        // Verify table structure
        db.all("PRAGMA table_info(invoices)", (err, rows) => {
          if (err) {
            console.error('❌ Error checking table structure:', err);
          } else {
            console.log('✅ Invoices table structure:');
            rows.forEach(row => {
              console.log(`  - ${row.name}: ${row.type}`);
            });
          }
          db.close();
        });
      });
    });
  });
});