const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

class DatabaseRestore {
  constructor() {
    this.connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    
    if (!this.connectionString) {
      console.error('❌ DATABASE_URL غير موجود في متغيرات البيئة');
      process.exit(1);
    }
  }

  async restoreFromJSON(backupFile) {
    const client = new Client({
      connectionString: this.connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
      await client.connect();
      console.log('✅ متصل بقاعدة البيانات للاستعادة');

      if (!fs.existsSync(backupFile)) {
        throw new Error(`ملف النسخة الاحتياطية غير موجود: ${backupFile}`);
      }

      const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
      
      for (const [tableName, rows] of Object.entries(backupData)) {
        if (!rows || rows.length === 0) continue;

        try {
          await client.query(`DELETE FROM ${tableName}`);
          
          const columns = Object.keys(rows[0]);
          const columnsList = columns.map(col => `"${col}"`).join(', ');
          const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
          
          const insertQuery = `INSERT INTO ${tableName} (${columnsList}) VALUES (${placeholders})`;
          
          for (const row of rows) {
            const values = columns.map(col => row[col]);
            await client.query(insertQuery, values);
          }
          
          console.log(`✅ تم استعادة ${tableName}: ${rows.length} سجل`);
          
        } catch (error) {
          console.error(`❌ خطأ في استعادة ${tableName}:`, error.message);
        }
      }

      console.log('✅ تم استعادة النسخة الاحتياطية بنجاح');

    } catch (error) {
      console.error('❌ خطأ في استعادة النسخة الاحتياطية:', error);
      throw error;
    } finally {
      await client.end();
    }
  }

  async listBackups() {
    const backupDir = path.join(__dirname, '../backups');
    
    if (!fs.existsSync(backupDir)) {
      console.log('📁 لا توجد نسخ احتياطية');
      return [];
    }

    const files = fs.readdirSync(backupDir)
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          path: filePath,
          size: (stats.size / 1024 / 1024).toFixed(2) + ' MB',
          created: stats.mtime.toLocaleString('ar-EG')
        };
      })
      .sort((a, b) => b.created.localeCompare(a.created));

    console.log('\n📋 النسخ الاحتياطية المتاحة:');
    files.forEach((file, index) => {
      console.log(`${index + 1}. ${file.name}`);
      console.log(`   الحجم: ${file.size} | التاريخ: ${file.created}`);
    });

    return files;
  }
}

module.exports = DatabaseRestore;

if (require.main === module) {
  const restore = new DatabaseRestore();
  
  const command = process.argv[2];
  const file = process.argv[3];

  switch (command) {
    case 'restore':
      if (!file) {
        console.error('❌ يجب تحديد ملف النسخة الاحتياطية');
        console.log('مثال: node restoreDatabase.js restore ../backups/backup-2024-01-01.json');
        process.exit(1);
      }
      restore.restoreFromJSON(file).catch(console.error);
      break;
    case 'list':
      restore.listBackups().catch(console.error);
      break;
    default:
      console.log('الاستخدام:');
      console.log('node restoreDatabase.js list                    - عرض النسخ الاحتياطية');
      console.log('node restoreDatabase.js restore <backup-file>   - استعادة نسخة احتياطية');
  }
}