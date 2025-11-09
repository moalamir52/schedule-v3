// Export SQLite data to CSV files for manual import
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

async function exportToCSV() {
  console.log('📤 Exporting SQLite data to CSV');
  console.log('===============================');
  
  const dbPath = path.join(__dirname, 'database', 'database.db');
  const db = new sqlite3.Database(dbPath);
  
  // Create exports folder
  const exportDir = path.join(__dirname, 'csv-exports');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir);
  }
  
  try {
    // Export customers
    await exportTable(db, 'customers', [
      'CustomerID', 'Name', 'Villa', 'Phone', 'Number of car', 'CarPlates',
      'Days', 'Time', 'Notes', 'Washman_Package', 'Fee', 'start date',
      'payment', 'Status', 'Serves', 'Serves Active', 'Car A', 'Car B', 'Car C'
    ], exportDir);
    
    // Export Workers
    await exportTable(db, 'Workers', ['WorkerID', 'Name', 'Job', 'Status'], exportDir);
    
    // Export wash_history
    await exportTable(db, 'wash_history', [
      'WashID', 'CustomerID', 'CarPlate', 'WashDate', 'PackageType',
      'Villa', 'WashTypePerformed', 'VisitNumberInWeek', 'WeekInCycle',
      'Status', 'WorkerName'
    ], exportDir);
    
    console.log('\n🎉 Export completed!');
    console.log(`📁 Files saved in: ${exportDir}`);
    
  } catch (error) {
    console.error('❌ Export failed:', error);
  } finally {
    db.close();
  }
}

function exportTable(db, tableName, columns, exportDir) {
  return new Promise((resolve, reject) => {
    console.log(`\n📋 Exporting ${tableName}...`);
    
    const columnStr = columns.map(col => `"${col}"`).join(', ');
    const query = `SELECT ${columnStr} FROM "${tableName}"`;
    
    db.all(query, (err, rows) => {
      if (err) {
        console.log(`⚠️  Table ${tableName} not found, skipping...`);
        resolve();
        return;
      }
      
      if (rows.length === 0) {
        console.log(`📭 ${tableName}: No data to export`);
        resolve();
        return;
      }
      
      // Create CSV content
      const csvHeader = columns.join(',');
      const csvRows = rows.map(row => {
        return columns.map(col => {
          const value = row[col];
          if (value === null || value === undefined) return '';
          // Escape quotes and wrap in quotes if contains comma
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',');
      });
      
      const csvContent = [csvHeader, ...csvRows].join('\n');
      
      // Save to file
      const filePath = path.join(exportDir, `${tableName}.csv`);
      fs.writeFileSync(filePath, csvContent, 'utf8');
      
      console.log(`✅ ${tableName}: ${rows.length} records exported to ${tableName}.csv`);
      resolve();
    });
  });
}

exportToCSV();