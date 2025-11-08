// Inspect SQLite database structure
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = './database/database.db';

function queryDB(db, sql) {
  return new Promise((resolve, reject) => {
    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

async function inspectDatabase() {
  console.log('🔍 Inspecting SQLite database structure...');
  console.log('Database path:', dbPath);
  
  const db = new sqlite3.Database(dbPath);
  
  try {
    // Get all tables
    const tables = await queryDB(db, "SELECT name FROM sqlite_master WHERE type='table'");
    console.log('\n📋 Found tables:');
    
    for (const table of tables) {
      console.log(`\n🗂️  Table: ${table.name}`);
      
      // Get table structure
      const columns = await queryDB(db, `PRAGMA table_info(${table.name})`);
      console.log('   Columns:');
      columns.forEach(col => {
        console.log(`     - ${col.name} (${col.type})`);
      });
      
      // Get row count
      const count = await queryDB(db, `SELECT COUNT(*) as count FROM ${table.name}`);
      console.log(`   Rows: ${count[0].count}`);
      
      // Show sample data if exists
      if (count[0].count > 0) {
        const sample = await queryDB(db, `SELECT * FROM ${table.name} LIMIT 2`);
        console.log('   Sample data:');
        sample.forEach((row, i) => {
          console.log(`     Row ${i + 1}:`, Object.keys(row).slice(0, 3).map(k => `${k}=${row[k]}`).join(', '));
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    db.close();
  }
}

inspectDatabase();