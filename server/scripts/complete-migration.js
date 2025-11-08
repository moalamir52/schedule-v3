const sqlite3 = require('sqlite3').verbose();
const { Client } = require('pg');

const BASE_URL = 'https://schedule-v3-server.onrender.com';
const dbPath = './database/database.db';

async function completeMigration() {
  console.log('🚀 Starting complete migration from SQLite to PostgreSQL...');
  
  try {
    // Step 1: Clear all PostgreSQL tables first
    console.log('🧹 Clearing all PostgreSQL tables...');
    try {
      const clearResponse = await fetch(`${BASE_URL}/api/database/clear-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (clearResponse.ok) {
        console.log('✅ PostgreSQL tables cleared successfully');
      } else {
        console.log('⚠️ Could not clear PostgreSQL tables, continuing anyway...');
      }
    } catch (error) {
      console.log('⚠️ Error clearing PostgreSQL:', error.message);
    }
    
    // Step 2: Read all tables from SQLite
    const db = new sqlite3.Database(dbPath);
    
    // Get all table names
    const tables = await new Promise((resolve, reject) => {
      db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(r => r.name));
      });
    });
    
    console.log(`📋 Found ${tables.length} tables:`, tables);
    
    // Export each table
    for (const tableName of tables) {
      console.log(`\n📤 Exporting table: ${tableName}`);
      
      const data = await new Promise((resolve, reject) => {
        db.all(`SELECT * FROM ${tableName}`, [], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
      
      console.log(`   Found ${data.length} records`);
      
      if (data.length > 0) {
        // Upload to production via API
        try {
          const response = await fetch(`${BASE_URL}/api/database/import/${tableName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data })
          });
          
          if (response.ok) {
            console.log(`   ✅ Uploaded ${tableName} successfully`);
          } else {
            console.log(`   ❌ Failed to upload ${tableName}: ${response.status}`);
          }
        } catch (error) {
          console.log(`   ❌ Error uploading ${tableName}: ${error.message}`);
        }
      }
    }
    
    db.close();
    console.log('\n🎉 Migration completed!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

completeMigration();