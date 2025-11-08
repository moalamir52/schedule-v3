const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

class DatabaseBackup {
  constructor() {
    this.connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    
    if (!this.connectionString) {
      console.error('❌ DATABASE_URL غير موجود في متغيرات البيئة');
      process.exit(1);
    }
  }

  async createBackup() {
    const client = new Client({
      connectionString: this.connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
      await client.connect();
      console.log('✅ متصل بقاعدة البيانات');

      const backupData = {};
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      const tables = [
        'customers', 'wash_history', 'workers', 'scheduledtasks', 
        'invoices', 'users', 'services', 'washrules', 'assignments',
        'scheduleauditlog', 'deleted_invoices'
      ];

      for (const table of tables) {
        try {
          const result = await client.query(`SELECT * FROM ${table}`);
          backupData[table] = result.rows;
          console.log(`📊 ${table}: ${result.rows.length} سجل`);
        } catch (error) {
          console.log(`⚠️ تخطي جدول ${table}: ${error.message}`);
          backupData[table] = [];
        }
      }

      const backupDir = path.join(__dirname, '../backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
      fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));

      console.log(`✅ تم إنشاء النسخة الاحتياطية: ${backupFile}`);
      
      await this.createSQLBackup(client, timestamp);
      
      return backupFile;

    } catch (error) {
      console.error('❌ خطأ في إنشاء النسخة الاحتياطية:', error);
      throw error;
    } finally {
      await client.end();
    }
  }

  async createSQLBackup(client, timestamp) {
    try {
      const backupDir = path.join(__dirname, '../backups');
      const sqlFile = path.join(backupDir, `backup-${timestamp}.sql`);
      
      let sqlContent = '-- Database Backup SQL\n';
      sqlContent += `-- Created: ${new Date().toISOString()}\n\n`;

      const tables = [
        'customers', 'wash_history', 'workers', 'scheduledtasks', 
        'invoices', 'users', 'services', 'washrules', 'assignments'
      ];

      for (const table of tables) {
        try {
          const result = await client.query(`SELECT * FROM ${table}`);
          
          if (result.rows.length > 0) {
            sqlContent += `-- Table: ${table}\n`;
            sqlContent += `DELETE FROM ${table};\n`;
            
            const columns = Object.keys(result.rows[0]);
            const columnsList = columns.map(col => `"${col}"`).join(', ');
            
            for (const row of result.rows) {
              const values = columns.map(col => {
                const value = row[col];
                if (value === null) return 'NULL';
                if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
                return value;
              }).join(', ');
              
              sqlContent += `INSERT INTO ${table} (${columnsList}) VALUES (${values});\n`;
            }
            sqlContent += '\n';
          }
        } catch (error) {
          sqlContent += `-- Error backing up table ${table}: ${error.message}\n\n`;
        }
      }

      fs.writeFileSync(sqlFile, sqlContent);
      console.log(`✅ تم إنشاء ملف SQL: ${sqlFile}`);
      
    } catch (error) {
      console.error('❌ خطأ في إنشاء ملف SQL:', error);
    }
  }

  async getDatabaseInfo() {
    const client = new Client({
      connectionString: this.connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
      await client.connect();
      
      const dbInfo = await client.query('SELECT current_database(), current_user, version()');
      const tableInfo = await client.query(`
        SELECT table_name, 
               (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
        FROM information_schema.tables t 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);

      console.log('\n📊 معلومات قاعدة البيانات:');
      console.log('قاعدة البيانات:', dbInfo.rows[0].current_database);
      console.log('المستخدم:', dbInfo.rows[0].current_user);
      console.log('الإصدار:', dbInfo.rows[0].version.split(' ')[0]);
      
      console.log('\n📋 الجداول الموجودة:');
      for (const table of tableInfo.rows) {
        const countResult = await client.query(`SELECT COUNT(*) FROM ${table.table_name}`);
        console.log(`- ${table.table_name}: ${countResult.rows[0].count} سجل`);
      }

      return {
        database: dbInfo.rows[0].current_database,
        user: dbInfo.rows[0].current_user,
        version: dbInfo.rows[0].version,
        tables: tableInfo.rows
      };

    } catch (error) {
      console.error('❌ خطأ في الحصول على معلومات قاعدة البيانات:', error);
      throw error;
    } finally {
      await client.end();
    }
  }
}

module.exports = DatabaseBackup;

if (require.main === module) {
  const backup = new DatabaseBackup();
  
  const command = process.argv[2];

  switch (command) {
    case 'backup':
      backup.createBackup().catch(console.error);
      break;
    case 'info':
      backup.getDatabaseInfo().catch(console.error);
      break;
    default:
      console.log('الاستخدام:');
      console.log('node databaseBackup.js backup  - إنشاء نسخة احتياطية');
      console.log('node databaseBackup.js info    - معلومات قاعدة البيانات');
  }
}