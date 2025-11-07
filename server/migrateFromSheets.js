const { 
  getCustomers, 
  getAllHistory, 
  getWorkers, 
  getScheduledTasks, 
  getInvoices, 
  getUsers, 
  getAdditionalServices,
  getAuditLogs,
  getSheetData
} = require('./services/googleSheetsService');
const db = require('./services/databaseService');

async function migrateData() {
  console.log('🚀 بدء نقل البيانات من Google Sheets إلى SQLite...');
  
  try {
    // 1. نقل العملاء
    console.log('📋 نقل بيانات العملاء...');
    const customers = await getCustomers();
    let customerCount = 0;
    for (const customer of customers) {
      try {
        await db.addCustomer(customer);
        customerCount++;
      } catch (error) {
        console.warn(`تحذير: فشل نقل العميل ${customer.CustomerName || customer.customername}: ${error.message}`);
      }
    }
    console.log(`✅ تم نقل ${customerCount} عميل من أصل ${customers.length}`);

    // 2. نقل تاريخ الغسيل
    console.log('🧼 نقل تاريخ الغسيل...');
    const history = await getAllHistory();
    for (const record of history) {
      await db.addHistoryRecord(record);
    }
    console.log(`✅ تم نقل ${history.length} سجل غسيل`);

    // 3. نقل العمال
    console.log('👷 نقل بيانات العمال...');
    const workers = await getWorkers();
    for (const worker of workers) {
      await db.addWorker(worker);
    }
    console.log(`✅ تم نقل ${workers.length} عامل`);

    // 4. نقل المهام المجدولة
    console.log('📅 نقل المهام المجدولة...');
    const tasks = await getScheduledTasks();
    await db.clearAndWriteSchedule(tasks);
    console.log(`✅ تم نقل ${tasks.length} مهمة مجدولة`);

    // 5. نقل الفواتير
    console.log('💰 نقل الفواتير...');
    const invoices = await getInvoices();
    for (const invoice of invoices) {
      await db.addInvoice(invoice);
    }
    console.log(`✅ تم نقل ${invoices.length} فاتورة`);

    // 6. نقل المستخدمين
    console.log('👤 نقل المستخدمين...');
    const users = await getUsers();
    for (const user of users) {
      await db.addUser(user);
    }
    console.log(`✅ تم نقل ${users.length} مستخدم`);

    // 7. نقل الخدمات
    console.log('🔧 نقل الخدمات...');
    const services = await getAdditionalServices();
    for (const service of services) {
      await db.addService(service);
    }
    console.log(`✅ تم نقل ${services.length} خدمة`);

    // 8. نقل سجلات التدقيق
    console.log('📊 نقل سجلات التدقيق...');
    const auditLogs = await getAuditLogs();
    for (const log of auditLogs) {
      await db.addAuditLog(log);
    }
    console.log(`✅ تم نقل ${auditLogs.length} سجل تدقيق`);

    // 9. نقل قواعد الغسيل (إن وجدت)
    console.log('📋 نقل قواعد الغسيل...');
    try {
      const washRules = await getSheetData('WashRules');
      console.log(`✅ تم نقل ${washRules.length} قاعدة غسيل`);
    } catch (error) {
      console.log('⚠️ لم يتم العثور على قواعد الغسيل');
    }

    // 10. نقل الفواتير المحذوفة (إن وجدت)
    console.log('🗑️ نقل الفواتير المحذوفة...');
    try {
      const deletedInvoices = await getSheetData('deleted_invoices');
      console.log(`✅ تم نقل ${deletedInvoices.length} فاتورة محذوفة`);
    } catch (error) {
      console.log('⚠️ لم يتم العثور على فواتير محذوفة');
    }

    console.log('🎉 تم النقل بنجاح!');
    console.log('📊 ملخص النقل:');
    console.log(`   - العملاء: ${customers.length}`);
    console.log(`   - تاريخ الغسيل: ${history.length}`);
    console.log(`   - العمال: ${workers.length}`);
    console.log(`   - المهام المجدولة: ${tasks.length}`);
    console.log(`   - الفواتير: ${invoices.length}`);
    console.log(`   - المستخدمين: ${users.length}`);
    console.log(`   - الخدمات: ${services.length}`);
    console.log(`   - سجلات التدقيق: ${auditLogs.length}`);

    console.log('\n💡 الآن يمكنك:');
    console.log('1. تشغيل المشروع باستخدام قاعدة البيانات الجديدة');
    console.log('2. حذف Google Sheets dependencies إذا أردت');
    console.log('3. الاستمتاع بسرعة أكبر في التطبيق!');

  } catch (error) {
    console.error('❌ فشل النقل:', error);
  }
}

// تشغيل النقل
if (require.main === module) {
  migrateData().then(() => {
    console.log('انتهى سكريبت النقل');
    process.exit(0);
  }).catch(err => {
    console.error('فشل سكريبت النقل:', err);
    process.exit(1);
  });
}

module.exports = { migrateData };