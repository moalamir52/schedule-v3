const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, 'database/database.db');

console.log('🔧 Fixing database schema...');

// Connect to existing database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Error connecting to database:', err);
    return;
  }
  console.log('✅ Connected to database');
  
  // Drop and recreate customers table with correct schema
  db.serialize(() => {
    db.run('DROP TABLE IF EXISTS customers', (err) => {
      if (err) {
        console.error('❌ Error dropping customers table:', err);
        return;
      }
      console.log('✅ Dropped old customers table');
      
      // Create new customers table
      const createTableSQL = `
        CREATE TABLE customers (
          CustomerID TEXT PRIMARY KEY COLLATE NOCASE,
          Name TEXT NOT NULL COLLATE NOCASE,
          Villa TEXT COLLATE NOCASE,
          CarPlates TEXT COLLATE NOCASE,
          Washman_Package TEXT COLLATE NOCASE,
          Days TEXT COLLATE NOCASE,
          Time TEXT,
          Status TEXT DEFAULT 'Active' COLLATE NOCASE,
          Phone TEXT,
          Email TEXT COLLATE NOCASE,
          Notes TEXT,
          Fee REAL,
          \`Number of car\` INTEGER,
          \`start date\` TEXT
        )
      `;
      
      db.run(createTableSQL, (err) => {
        if (err) {
          console.error('❌ Error creating customers table:', err);
          return;
        }
        console.log('✅ Created new customers table');
        
        // Insert seed data
        const seedData = `
          INSERT INTO customers (CustomerID, Name, Villa, CarPlates, Washman_Package, Days, Time, Status, Phone, Notes, Fee, \`Number of car\`, \`start date\`) VALUES
          ('CUST-001', 'Ahmed Ali', 'Villa 101', 'ABC-123', '3 EXT 1 INT', 'Monday', '8:00 AM', 'Active', '050-123-4567', 'Regular customer', 150.0, 1, '1-Oct-24'),
          ('CUST-002', 'Sara Mohammed', 'Villa 102', 'DEF-456', '2 EXT 1 INT', 'Tuesday', '9:00 AM', 'Active', '050-234-5678', 'Prefers morning slots', 120.0, 1, '1-Oct-24'),
          ('CUST-003', 'Omar Hassan', 'Villa 103', 'GHI-789', '3 EXT Only', 'Wednesday', '10:00 AM', 'Active', '050-345-6789', 'Exterior only', 90.0, 1, '1-Oct-24'),
          ('CUST-004', 'Fatima Al-Zahra', 'Villa 104', 'JKL-012', '2 EXT 1 INT bi week', 'Thursday', '11:00 AM', 'Active', '050-456-7890', 'Bi-weekly package', 120.0, 1, '1-Oct-24'),
          ('CUST-005', 'Khalid Ibrahim', 'Villa 105', 'MNO-345', '4 EXT 1 INT', 'Friday', '12:00 PM', 'Active', '050-567-8901', 'Premium package', 200.0, 1, '1-Oct-24')
        `;
        
        db.exec(seedData, (err) => {
          if (err) {
            console.error('❌ Error inserting seed data:', err);
            return;
          }
          console.log('✅ Inserted seed data');
          
          // Verify data
          db.all('SELECT COUNT(*) as count FROM customers', (err, rows) => {
            if (err) {
              console.error('❌ Error verifying data:', err);
            } else {
              console.log(`✅ Database ready with ${rows[0].count} customers`);
            }
            
            // Test a query
            db.all('SELECT CustomerID, Name, Villa FROM customers LIMIT 3', (err, rows) => {
              if (err) {
                console.error('❌ Error testing query:', err);
              } else {
                console.log('✅ Sample customers:');
                rows.forEach(row => {
                  console.log(`  - ${row.CustomerID}: ${row.Name} (${row.Villa})`);
                });
              }
              db.close();
            });
          });
        });
      });
    });
  });
});