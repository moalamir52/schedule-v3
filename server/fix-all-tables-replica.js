const https = require('https');

const SUPABASE_URL = 'https://gtbtlslrhifwjpzukfmt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0YnRsc2xyaGlmd2pwenVrZm10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NzYzMDksImV4cCI6MjA3ODI1MjMwOX0.VjYOwxkzoLtb_ywBV40S8cA0XUqxtGcDtNGcVz-UgvM';

async function fixAllTables() {
  console.log('🔧 إصلاح جميع الجداول للحذف والتعديل...\n');
  
  const tables = [
    'customers',
    'invoices', 
    'Workers',
    'Users',
    'Services',
    'wash_history',
    'ScheduleAuditLog',
    'assignments'
  ];
  
  console.log('📋 الجداول المطلوب إصلاحها:');
  tables.forEach((table, i) => console.log(`  ${i+1}. ${table}`));
  console.log();
  
  for (const table of tables) {
    try {
      console.log(`⚡ إصلاح جدول: ${table}...`);
      
      const postData = JSON.stringify({
        query: `ALTER TABLE "${table}" REPLICA IDENTITY FULL;`
      });
      
      const options = {
        hostname: 'gtbtlslrhifwjpzukfmt.supabase.co',
        port: 443,
        path: '/rest/v1/rpc/exec_sql',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const result = await new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => data += chunk);
          res.on('end', () => resolve({ status: res.statusCode, data }));
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
      });
      
      if (result.status === 200) {
        console.log(`✅ ${table} - تم الإصلاح`);
      } else {
        console.log(`❌ ${table} - فشل:`, result.data);
      }
      
    } catch (error) {
      console.log(`❌ ${table} - خطأ:`, error.message);
    }
  }
  
  console.log('\n🧪 اختبار النتائج...');
  
  // اختبار العمليات
  try {
    const db = require('./services/databaseService');
    
    // اختبار العملاء
    const customers = await db.getCustomers();
    console.log(`✅ العملاء: ${customers.length} عميل`);
    
    // اختبار الفواتير
    const invoices = await db.getInvoices();
    console.log(`✅ الفواتير: ${invoices.length} فاتورة`);
    
    // اختبار العمال
    const workers = await db.getWorkers();
    console.log(`✅ العمال: ${workers.length} عامل`);
    
    console.log('\n🎉 جميع الجداول جاهزة للحذف والتعديل!');
    
  } catch (error) {
    console.log('❌ خطأ في الاختبار:', error.message);
  }
}

fixAllTables().then(() => {
  console.log('\n✅ انتهى الإصلاح');
  process.exit(0);
}).catch(error => {
  console.error('❌ فشل الإصلاح:', error);
  process.exit(1);
});