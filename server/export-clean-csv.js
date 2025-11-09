// Export with exact Supabase column names
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

async function exportCleanCSV() {
  console.log('📤 Exporting Clean CSV for Supabase');
  console.log('===================================');
  
  const dbPath = path.join(__dirname, 'database', 'database.db');
  const db = new sqlite3.Database(dbPath);
  
  const exportDir = path.join(__dirname, 'clean-csv');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir);
  }
  
  try {
    // Export customers with exact Supabase column names
    await exportTable(db, 'customers', {
      'CustomerID': 'CustomerID',
      'Name': 'Name', 
      'Villa': 'Villa',
      'Phone': 'Phone',
      'Number of car': 'Number of car',
      'CarPlates': 'CarPlates',
      'Days': 'Days',
      'Time': 'Time',
      'Notes': 'Notes',
      'Washman_Package': 'Washman_Package',
      'Fee': 'Fee',
      'start date': 'start date',
      'payment': 'payment',
      'Status': 'Status',
      'Serves': 'Serves',
      'Serves Active': 'Serves Active',
      'Car A': 'Car A',
      'Car B': 'Car B',
      'Car C': 'Car C'
    }, exportDir);
    
    // Export Workers
    await exportTable(db, 'Workers', {
      'WorkerID': 'WorkerID',
      'Name': 'Name',
      'Job': 'Job', 
      'Status': 'Status'
    }, exportDir);
    
    console.log('\n🎉 Clean CSV export completed!');
    console.log(`📁 Files in: ${exportDir}`);
    
  } catch (error) {
    console.error('❌ Export failed:', error);
  } finally {
    db.close();
  }
}

function exportTable(db, tableName, columnMapping, exportDir) {
  return new Promise((resolve, reject) => {
    console.log(`\n📋 Exporting ${tableName}...`);
    
    const sqlColumns = Object.keys(columnMapping).map(col => `"${col}"`).join(', ');
    const csvColumns = Object.values(columnMapping);
    const query = `SELECT ${sqlColumns} FROM "${tableName}"`;
    
    db.all(query, (err, rows) => {
      if (err) {
        console.log(`⚠️  ${tableName} error:`, err.message);
        resolve();
        return;
      }
      
      if (rows.length === 0) {
        console.log(`📭 ${tableName}: No data`);
        resolve();
        return;
      }
      
      // Create CSV with clean headers (no quotes)
      const csvHeader = csvColumns.join(',');
      const csvRows = rows.map(row => {
        return Object.keys(columnMapping).map(col => {
          const value = row[col];
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          // Escape commas and quotes
          if (stringValue.includes(',') || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',');
      });
      
      const csvContent = [csvHeader, ...csvRows].join('\n');
      const filePath = path.join(exportDir, `${tableName}.csv`);
      fs.writeFileSync(filePath, csvContent, 'utf8');
      
      console.log(`✅ ${tableName}: ${rows.length} records → ${tableName}.csv`);
      resolve();
    });
  });
}

exportCleanCSV();