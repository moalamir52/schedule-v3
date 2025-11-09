async function testBuildSchedule() {
  console.log('🧪 اختبار بناء الجدولة...\n');
  
  try {
    const { buildWeeklySchedule } = require('./services/logicService');
    const db = require('./services/databaseService');
    
    // فحص العملاء
    console.log('1️⃣ فحص العملاء...');
    const customers = await db.getCustomers();
    console.log(`عدد العملاء: ${customers.length}`);
    
    if (customers.length > 0) {
      console.log('عينة من العملاء:');
      customers.slice(0, 3).forEach((customer, i) => {
        console.log(`  ${i+1}. ${customer.Name} - ${customer.Villa} - ${customer.Days}`);
      });
    }
    
    // فحص العمال
    console.log('\n2️⃣ فحص العمال...');
    const workers = await db.getWorkers();
    console.log(`عدد العمال: ${workers.length}`);
    
    if (workers.length > 0) {
      console.log('العمال:');
      workers.forEach((worker, i) => {
        console.log(`  ${i+1}. ${worker.Name || worker.name} - ${worker.Status || worker.status}`);
      });
    }
    
    // محاولة بناء الجدولة
    console.log('\n3️⃣ محاولة بناء الجدولة...');
    const schedule = await buildWeeklySchedule();
    console.log(`النتيجة: ${schedule.length} مهمة`);
    
    if (schedule.length === 0) {
      console.log('❌ لم يتم إنشاء أي مهام');
      console.log('🔧 الأسباب المحتملة:');
      console.log('  - لا يوجد عملاء نشطين');
      console.log('  - لا يوجد عمال متاحين');
      console.log('  - مشكلة في دالة buildWeeklySchedule');
    } else {
      console.log('✅ تم بناء الجدولة بنجاح');
      console.log('عينة من المهام:');
      schedule.slice(0, 3).forEach((task, i) => {
        console.log(`  ${i+1}. ${task.customerName} - ${task.day} - ${task.time}`);
      });
    }
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
    console.error('Stack:', error.stack);
  }
}

testBuildSchedule().then(() => {
  console.log('\n🎉 انتهى الاختبار');
  process.exit(0);
}).catch(error => {
  console.error('❌ فشل الاختبار:', error);
  process.exit(1);
});