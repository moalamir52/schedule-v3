const fs = require('fs');

const SERVER_URL = 'https://schedule-v3-server.onrender.com/api';

async function pullFromServer() {
  console.log('📥 Downloading data from server...');
  
  try {
    // Get server data
    const customersRes = await fetch(`${SERVER_URL}/customers`);
    const workersRes = await fetch(`${SERVER_URL}/workers`);
    
    const customers = await customersRes.json();
    const workers = await workersRes.json();
    
    // Save as JSON files
    const backupData = {
      customers: customers,
      workers: workers,
      timestamp: new Date().toISOString(),
      source: 'production-server'
    };
    
    const filename = `./backups/server-data-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    
    // Create backups directory if it doesn't exist
    if (!fs.existsSync('./backups')) {
      fs.mkdirSync('./backups');
    }
    
    fs.writeFileSync(filename, JSON.stringify(backupData, null, 2));
    
    console.log('✅ Server data downloaded successfully!');
    console.log(`📁 Saved to: ${filename}`);
    console.log(`👥 Customers: ${customers.length}`);
    console.log(`👷 Workers: ${workers.length}`);
    
  } catch (error) {
    console.error('❌ Error downloading from server:', error.message);
  }
}

async function pushToServer() {
  console.log('📤 This feature requires local database setup.');
  console.log('💡 Use the JSON backup files to manually restore data if needed.');
}

// Command line usage
const command = process.argv[2];

if (command === 'pull') {
  pullFromServer();
} else if (command === 'push') {
  pushToServer();
} else {
  console.log('Simple Database Sync Tool');
  console.log('========================');
  console.log('Usage:');
  console.log('  node simple-sync.js pull  - Download server data as JSON backup');
  console.log('  node simple-sync.js push  - Upload data to server (not implemented)');
}