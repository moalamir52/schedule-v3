// Check current database schema and column names
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function checkDatabaseSchema() {
  console.log('🔍 Checking Current Database Schema');
  console.log('==================================');
  
  const dbPath = path.join(__dirname, 'database', 'database.db');
  const db = new sqlite3.Database(dbPath);
  
  // Get all table names
  const tables = await new Promise((resolve, reject) => {
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
      if (err) reject(err);
      else resolve(rows.map(row => row.name));
    });
  });
  
  console.log('📋 Found tables:', tables);
  console.log('');
  
  // Check each table's columns
  for (const tableName of tables) {
    console.log(`🔍 Table: ${tableName}`);
    console.log('─'.repeat(50));
    
    // Get column info
    const columns = await new Promise((resolve, reject) => {
      db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    columns.forEach(col => {
      console.log(`   ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
    });
    
    // Get sample data
    const sampleData = await new Promise((resolve, reject) => {
      db.all(`SELECT * FROM ${tableName} LIMIT 1`, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    if (sampleData.length > 0) {
      console.log('   📊 Sample data columns:', Object.keys(sampleData[0]));
    }
    
    console.log('');
  }
  
  db.close();
  
  console.log('✅ Schema check completed');
  console.log('');
  console.log('📋 Next: Review column names and create exact Supabase schema');
}

checkDatabaseSchema().catch(console.error);