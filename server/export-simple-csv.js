// Export with simple column names
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

async function exportSimpleCSV() {
  console.log('📤 Exporting Simple CSV');
  console.log('=======================');
  
  const dbPath = path.join(__dirname, 'database', 'database.db');
  const db = new sqlite3.Database(dbPath);
  
  const exportDir = path.join(__dirname, 'simple-csv');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir);
  }
  
  try {
    // Export customers with simple names
    await exportCustomers(db, exportDir);
    await exportWorkers(db, exportDir);
    
    console.log('\n🎉 Simple CSV export completed!');
    
  } catch (error) {
    console.error('❌ Export failed:', error);
  } finally {
    db.close();
  }
}

function exportCustomers(db, exportDir) {
  return new Promise((resolve) => {
    console.log('\n📋 Exporting customers...');
    
    db.all('SELECT * FROM customers', (err, rows) => {
      if (err || rows.length === 0) {
        console.log('📭 No customers data');
        resolve();
        return;
      }
      
      // Simple CSV header
      const csvHeader = 'customer_id,name,villa,phone,number_of_cars,car_plates,days,time,notes,package,fee,start_date,payment,status,serves,serves_active,car_a,car_b,car_c';
      
      const csvRows = rows.map(row => {
        return [
          row.CustomerID || '',
          row.Name || '',
          row.Villa || '',
          row.Phone || '',
          row['Number of car'] || '',
          row.CarPlates || '',
          row.Days || '',
          row.Time || '',
          row.Notes || '',
          row.Washman_Package || '',
          row.Fee || '',
          row['start date'] || '',
          row.payment || '',
          row.Status || '',
          row.Serves || '',
          row['Serves Active'] || '',
          row['Car A'] || '',
          row['Car B'] || '',
          row['Car C'] || ''
        ].map(val => {
          const str = String(val);
          return str.includes(',') ? `"${str}"` : str;
        }).join(',');
      });
      
      const csvContent = [csvHeader, ...csvRows].join('\n');
      fs.writeFileSync(path.join(exportDir, 'customers.csv'), csvContent);
      
      console.log(`✅ customers: ${rows.length} records`);
      resolve();
    });
  });
}

function exportWorkers(db, exportDir) {
  return new Promise((resolve) => {
    console.log('\n👷 Exporting workers...');
    
    db.all('SELECT * FROM Workers', (err, rows) => {
      if (err || rows.length === 0) {
        console.log('📭 No workers data');
        resolve();
        return;
      }
      
      const csvHeader = 'worker_id,name,job,status';
      const csvRows = rows.map(row => {
        return [
          row.WorkerID || '',
          row.Name || '',
          row.Job || '',
          row.Status || ''
        ].join(',');
      });
      
      const csvContent = [csvHeader, ...csvRows].join('\n');
      fs.writeFileSync(path.join(exportDir, 'workers.csv'), csvContent);
      
      console.log(`✅ workers: ${rows.length} records`);
      resolve();
    });
  });
}

exportSimpleCSV();