const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'database/database.db');

console.log('🔧 Adding missing InvoiceDate column to invoices table...');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Error connecting to database:', err);
    return;
  }
  console.log('✅ Connected to database');
  
  // Add the missing InvoiceDate column
  db.run('ALTER TABLE invoices ADD COLUMN InvoiceDate TEXT', (err) => {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('✅ InvoiceDate column already exists');
      } else {
        console.error('❌ Error adding InvoiceDate column:', err);
        db.close();
        return;
      }
    } else {
      console.log('✅ Added InvoiceDate column');
    }
    
    // Update existing records to have InvoiceDate = CreatedAt
    db.run('UPDATE invoices SET InvoiceDate = CreatedAt WHERE InvoiceDate IS NULL', (err) => {
      if (err) {
        console.error('❌ Error updating InvoiceDate values:', err);
      } else {
        console.log('✅ Updated existing records with InvoiceDate values');
      }
      
      // Add missing columns if they don't exist
      const missingColumns = [
        'SubTotal REAL',
        'Phone TEXT',
        'Payment TEXT', 
        'Subject TEXT'
      ];
      
      let completed = 0;
      missingColumns.forEach(column => {
        const [columnName, columnType] = column.split(' ');
        db.run(`ALTER TABLE invoices ADD COLUMN ${column}`, (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.error(`❌ Error adding ${columnName} column:`, err);
          } else {
            console.log(`✅ ${columnName} column ready`);
          }
          
          completed++;
          if (completed === missingColumns.length) {
            // Verify table structure
            db.all("PRAGMA table_info(invoices)", (err, rows) => {
              if (err) {
                console.error('❌ Error checking table structure:', err);
              } else {
                console.log('✅ Current invoices table structure:');
                rows.forEach(row => {
                  console.log(`  - ${row.name}: ${row.type}`);
                });
              }
              db.close();
              console.log('🎉 Invoice table fix completed!');
            });
          }
        });
      });
    });
  });
});