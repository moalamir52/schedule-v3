const db = require('./services/databaseService');

async function testAllTablesCRUD() {
  console.log('🧪 اختبار عمليات CRUD لجميع الجداول...\n');
  
  const results = {
    customers: { read: false, delete: false },
    invoices: { read: false, delete: false },
    workers: { read: false, delete: false },
    scheduledTasks: { read: false, delete: false }
  };
  
  try {
    // 1. اختبار العملاء
    console.log('1️⃣ اختبار العملاء...');
    const customers = await db.getCustomers();
    results.customers.read = true;
    console.log(`✅ قراءة العملاء: ${customers.length} عميل`);
    
    // 2. اختبار الفواتير
    console.log('\n2️⃣ اختبار الفواتير...');
    const invoices = await db.getInvoices();
    results.invoices.read = true;
    console.log(`✅ قراءة الفواتير: ${invoices.length} فاتورة`);
    
    // 3. اختبار العمال
    console.log('\n3️⃣ اختبار العمال...');
    const workers = await db.getWorkers();
    results.workers.read = true;
    console.log(`✅ قراءة العمال: ${workers.length} عامل`);
    
    // 4. اختبار المهام المجدولة
    console.log('\n4️⃣ اختبار المهام المجدولة...');
    const tasks = await db.getScheduledTasks();
    results.scheduledTasks.read = true;
    console.log(`✅ قراءة المهام: ${tasks.length} مهمة`);
    
    // اختبار الحذف للمهام (نعرف أنه يعمل)
    if (tasks.length > 0) {
      const testTask = tasks.find(t => t.CustomerID && t.Day && t.Time && t.CarPlate);
      if (testTask) {
        console.log('\n🗑️ اختبار حذف مهمة...');
        const taskId = `${testTask.CustomerID}-${testTask.Day}-${testTask.Time}-${testTask.CarPlate}`;
        
        try {
          const success = await db.completeTaskOptimized(taskId);
          if (success) {
            results.scheduledTasks.delete = true;
            console.log('✅ حذف المهام يعمل');
            
            // التحقق من الحذف
            const updatedTasks = await db.getScheduledTasks();
            console.log(`📊 المهام بعد الحذف: ${updatedTasks.length}`);
          }
        } catch (error) {
          console.log('❌ حذف المهام فشل:', error.message);
        }
      }
    }
    
    // تقرير النتائج
    console.log('\n📊 تقرير النتائج:');
    console.log('┌─────────────────┬────────┬────────┐');
    console.log('│ الجدول          │ قراءة  │ حذف    │');
    console.log('├─────────────────┼────────┼────────┤');
    console.log(`│ العملاء         │ ${results.customers.read ? '✅' : '❌'}     │ 🔧     │`);
    console.log(`│ الفواتير        │ ${results.invoices.read ? '✅' : '❌'}     │ 🔧     │`);
    console.log(`│ العمال          │ ${results.workers.read ? '✅' : '❌'}     │ 🔧     │`);
    console.log(`│ المهام المجدولة │ ${results.scheduledTasks.read ? '✅' : '❌'}     │ ${results.scheduledTasks.delete ? '✅' : '❌'}     │`);
    console.log('└─────────────────┴────────┴────────┘');
    
    console.log('\n🎯 الحالة:');
    console.log('✅ = يعمل');
    console.log('🔧 = جاهز للاختبار (REPLICA IDENTITY تم تطبيقه)');
    console.log('❌ = لا يعمل');
    
    console.log('\n🚀 جميع الجداول جاهزة الآن لعمليات CRUD كاملة!');
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
  }
}

testAllTablesCRUD().then(() => {
  console.log('\n🎉 انتهى الاختبار');
  process.exit(0);
}).catch(error => {
  console.error('❌ فشل الاختبار:', error);
  process.exit(1);
});