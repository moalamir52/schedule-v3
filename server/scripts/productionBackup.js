// نسخ احتياطي من قاعدة البيانات على الإنتاج
const https = require('https');
const fs = require('fs');
const path = require('path');

class ProductionBackup {
  constructor(siteUrl) {
    this.siteUrl = siteUrl.replace(/\/$/, ''); // إزالة / من النهاية
  }

  async downloadData(endpoint) {
    return new Promise((resolve, reject) => {
      const url = `${this.siteUrl}/api/${endpoint}`;
      console.log(`📥 تحميل من: ${url}`);
      
      https.get(url, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (error) {
            reject(new Error(`خطأ في تحليل JSON: ${error.message}`));
          }
        });
      }).on('error', (error) => {
        reject(error);
      });
    });
  }

  async createFullBackup() {
    try {
      console.log('🔄 بدء النسخ الاحتياطي من الإنتاج...');
      
      const backupData = {};
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      // قائمة endpoints للبيانات
      const endpoints = [
        'customers',
        'workers', 
        'schedule/assign/current',
        'invoices',
        'users'
      ];

      for (const endpoint of endpoints) {
        try {
          console.log(`📊 تحميل ${endpoint}...`);
          const data = await this.downloadData(endpoint);
          backupData[endpoint.replace('/', '_')] = data;
          console.log(`✅ تم تحميل ${endpoint}`);
        } catch (error) {
          console.log(`⚠️ تخطي ${endpoint}: ${error.message}`);
          backupData[endpoint.replace('/', '_')] = null;
        }
      }

      // حفظ النسخة الاحتياطية
      const backupDir = path.join(__dirname, '../backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const backupFile = path.join(backupDir, `production-backup-${timestamp}.json`);
      fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));

      console.log(`✅ تم إنشاء النسخة الاحتياطية: ${backupFile}`);
      return backupFile;

    } catch (error) {
      console.error('❌ خطأ في النسخ الاحتياطي:', error);
      throw error;
    }
  }
}

// تشغيل مباشر
if (require.main === module) {
  const siteUrl = process.argv[2];
  
  if (!siteUrl) {
    console.error('❌ يجب تحديد رابط الموقع');
    console.log('مثال: node productionBackup.js https://your-site.onrender.com');
    process.exit(1);
  }

  const backup = new ProductionBackup(siteUrl);
  backup.createFullBackup().catch(console.error);
}

module.exports = ProductionBackup;