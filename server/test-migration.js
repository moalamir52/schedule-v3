// Test migration for one table
const sqlite3 = require('sqlite3').verbose();
const https = require('https');
const path = require('path');

const SUPABASE_URL = 'https://gtbtlslrhifwjpzukfmt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0YnRsc2xyaGlmd2pwenVrZm10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NzYzMDksImV4cCI6MjA3ODI1MjMwOX0.VjYOwxkzoLtb_ywBV40S8cA0XUqxtGcDtNGcVz-UgvM';

async function testMigration() {
  console.log('🧪 Testing Migration');
  console.log('===================');
  
  const dbPath = path.join(__dirname, 'database', 'database.db');
  const db = new sqlite3.Database(dbPath);
  
  // Test with Workers table first (simple structure)
  db.all('SELECT * FROM Workers LIMIT 5', async (err, rows) => {
    if (err) {
      console.error('❌ Error:', err);
      return;
    }
    
    console.log('📋 Workers data:', rows);
    
    if (rows.length > 0) {
      // Clean the data
      const cleanRows = rows.map(row => {
        const clean = {};
        if (row.WorkerID) clean.WorkerID = row.WorkerID;
        if (row.Name) clean.Name = row.Name;
        if (row.Job) clean.Job = row.Job;
        if (row.Status) clean.Status = row.Status;
        return clean;
      });
      
      console.log('🧹 Clean data:', cleanRows);
      
      try {
        await insertToSupabase('Workers', cleanRows);
        console.log('✅ Workers migrated successfully!');
      } catch (error) {
        console.error('❌ Migration failed:', error.message);
      }
    }
    
    db.close();
  });
}

function insertToSupabase(tableName, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'gtbtlslrhifwjpzukfmt.supabase.co',
      port: 443,
      path: `/rest/v1/${tableName}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=minimal',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

testMigration();