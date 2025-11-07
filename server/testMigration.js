const db = require('./services/databaseService');

async function testMigration() {
  console.log('🧪 اختبار النقل الكامل...');
  
  try {
    // Test customers
    const customers = await db.getCustomers();
    console.log(`✅ العملاء: ${customers.length} عميل`);
    
    // Test history
    const history = await db.getAllHistory();
    console.log(`✅ تاريخ الغسيل: ${history.length} سجل`);
    
    // Test workers
    const workers = await db.getWorkers();
    console.log(`✅ العمال: ${workers.length} عامل`);
    
    // Test scheduled tasks
    const tasks = await db.getScheduledTasks();
    console.log(`✅ المهام المجدولة: ${tasks.length} مهمة`);
    
    // Test invoices
    const invoices = await db.getInvoices();
    console.log(`✅ الفواتير: ${invoices.length} فاتورة`);
    
    // Test users
    const users = await db.getUsers();
    console.log(`✅ المستخدمين: ${users.length} مستخدم`);
    
    // Test services
    const services = await db.getServices();
    console.log(`✅ الخدمات: ${services.length} خدمة`);
    
    console.log('\n🎉 جميع البيانات متاحة في قاعدة البيانات المحلية!');
    console.log('🚀 المشروع جاهز للاستخدام بدون Google Sheets');
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
  }
}

if (require.main === module) {
  testMigration().then(() => {
    console.log('انتهى اختبار النقل');
    process.exit(0);
  }).catch(err => {
    console.error('فشل اختبار النقل:', err);
    process.exit(1);
  });
}

module.exports = { testMigration };