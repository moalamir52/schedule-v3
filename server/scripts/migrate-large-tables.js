const sqlite3 = require('sqlite3').verbose();

const BASE_URL = 'https://schedule-v3-server.onrender.com';
const dbPath = './database/database.db';

async function migrateLargeTables() {
  console.log('📦 Migrating large tables in batches...');
  
  try {
    const db = new sqlite3.Database(dbPath);
    
    // Migrate wash_history in batches
    console.log('\n📤 Migrating wash_history...');
    const washHistory = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM wash_history', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log(`Found ${washHistory.length} wash_history records`);
    
    const batchSize = 50;
    for (let i = 0; i < washHistory.length; i += batchSize) {
      const batch = washHistory.slice(i, i + batchSize);
      console.log(`   Uploading batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(washHistory.length/batchSize)} (${batch.length} records)`);
      
      try {
        const response = await fetch(`${BASE_URL}/api/database/import/wash_history`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: batch, append: i > 0 })
        });
        
        if (response.ok) {
          console.log(`   ✅ Batch uploaded successfully`);
        } else {
          console.log(`   ❌ Batch failed: ${response.status}`);
        }
      } catch (error) {
        console.log(`   ❌ Batch error: ${error.message}`);
      }
      
      // Wait between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Migrate WashRules in batches
    console.log('\n📤 Migrating WashRules...');
    const washRules = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM WashRules', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log(`Found ${washRules.length} WashRules records`);
    
    for (let i = 0; i < washRules.length; i += batchSize) {
      const batch = washRules.slice(i, i + batchSize);
      console.log(`   Uploading batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(washRules.length/batchSize)} (${batch.length} records)`);
      
      try {
        const response = await fetch(`${BASE_URL}/api/database/import/WashRules`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: batch, append: i > 0 })
        });
        
        if (response.ok) {
          console.log(`   ✅ Batch uploaded successfully`);
        } else {
          console.log(`   ❌ Batch failed: ${response.status}`);
        }
      } catch (error) {
        console.log(`   ❌ Batch error: ${error.message}`);
      }
      
      // Wait between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    db.close();
    console.log('\n🎉 Large tables migration completed!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

migrateLargeTables();