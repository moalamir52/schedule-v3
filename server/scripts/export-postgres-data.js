const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Use Render PostgreSQL connection
const client = new Client({
  connectionString: 'postgresql://schedule_v3_user:VJhJGJhJGJhJGJhJGJhJGJhJGJhJGJhJ@dpg-cslhqjbtq21c73a7qlmg-a.oregon-postgres.render.com/schedule_v3',
  ssl: { rejectUnauthorized: false }
});

async function exportData() {
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    const tables = [
      'customers',
      'workers', 
      'wash_history',
      'invoices',
      'users',
      '"Services"',
      '"ScheduledTasks"'
    ];

    let sqlOutput = '-- PostgreSQL Data Export\n\n';

    for (const table of tables) {
      console.log(`📦 Exporting ${table}...`);
      
      try {
        const result = await client.query(`SELECT * FROM ${table}`);
        console.log(`   Found ${result.rows.length} records`);

        if (result.rows.length > 0) {
          // Get column names
          const columns = Object.keys(result.rows[0]);
          const quotedColumns = columns.map(col => `"${col}"`).join(', ');
          
          sqlOutput += `-- Data for table ${table}\n`;
          sqlOutput += `DELETE FROM ${table};\n`;
          
          for (const row of result.rows) {
            const values = columns.map(col => {
              const value = row[col];
              if (value === null) return 'NULL';
              if (typeof value === 'string') {
                return `'${value.replace(/'/g, "''")}'`;
              }
              return value;
            }).join(', ');
            
            sqlOutput += `INSERT INTO ${table} (${quotedColumns}) VALUES (${values});\n`;
          }
          sqlOutput += '\n';
        }
      } catch (error) {
        console.log(`   ⚠️ Error with ${table}: ${error.message}`);
      }
    }

    // Save to file
    const outputPath = path.join(__dirname, '../database/postgres-export.sql');
    fs.writeFileSync(outputPath, sqlOutput);
    console.log(`✅ Data exported to: ${outputPath}`);
    
    await client.end();
    
  } catch (error) {
    console.error('❌ Export failed:', error);
  }
}

exportData();