const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, 'database/database.db');

// Delete existing database
if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
  console.log('✅ Deleted existing database');
}

// Create new database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Error creating database:', err);
    return;
  }
  console.log('✅ Created new database');
  
  // Read and execute schema
  const schemaPath = path.join(__dirname, 'database/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  const modifiedSchema = schema.replace(/CREATE TABLE /g, 'CREATE TABLE IF NOT EXISTS ');
  
  db.exec(modifiedSchema, (err) => {
    if (err) {
      console.error('❌ Error creating tables:', err);
      return;
    }
    console.log('✅ Created database tables');
    
    // Read and execute seed data
    const seedPath = path.join(__dirname, 'database/seed-customers.sql');
    const seedData = fs.readFileSync(seedPath, 'utf8');
    
    db.exec(seedData, (err) => {
      if (err) {
        console.error('❌ Error seeding data:', err);
        return;
      }
      console.log('✅ Seeded customer data');
      
      // Verify data
      db.all('SELECT COUNT(*) as count FROM customers', (err, rows) => {
        if (err) {
          console.error('❌ Error verifying data:', err);
        } else {
          console.log(`✅ Database ready with ${rows[0].count} customers`);
        }
        db.close();
      });
    });
  });
});