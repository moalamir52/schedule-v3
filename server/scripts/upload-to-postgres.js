// Upload existing data to new PostgreSQL database
const fs = require('fs');
const path = require('path');

const SERVER_URL = 'https://schedule-v3-server.onrender.com/api';

async function uploadData() {
  console.log('📤 Uploading data to PostgreSQL...');
  
  try {
    // Find the latest backup file
    const backupsDir = './backups';
    const files = fs.readdirSync(backupsDir)
      .filter(f => f.startsWith('server-data-') && f.endsWith('.json'))
      .sort()
      .reverse();
    
    if (files.length === 0) {
      console.log('❌ No backup files found. Run pull first.');
      return;
    }
    
    const latestBackup = files[0];
    console.log(`📁 Using backup: ${latestBackup}`);
    
    const backupData = JSON.parse(fs.readFileSync(path.join(backupsDir, latestBackup), 'utf8'));
    
    console.log(`👥 Found ${backupData.customers.length} customers`);
    console.log(`👷 Found ${backupData.workers.length} workers`);
    
    // Upload customers
    for (const customer of backupData.customers) {
      try {
        const response = await fetch(`${SERVER_URL}/customers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(customer)
        });
        
        if (response.ok) {
          console.log(`✅ Customer uploaded: ${customer.CustomerName || customer.Name}`);
        } else {
          console.log(`⚠️  Failed to upload customer: ${customer.CustomerName || customer.Name}`);
        }
      } catch (error) {
        console.log(`❌ Error uploading customer: ${error.message}`);
      }
    }
    
    // Upload workers
    for (const worker of backupData.workers) {
      try {
        const response = await fetch(`${SERVER_URL}/workers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(worker)
        });
        
        if (response.ok) {
          console.log(`✅ Worker uploaded: ${worker.Name}`);
        } else {
          console.log(`⚠️  Failed to upload worker: ${worker.Name}`);
        }
      } catch (error) {
        console.log(`❌ Error uploading worker: ${error.message}`);
      }
    }
    
    console.log('🎉 Data migration completed!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  }
}

uploadData();