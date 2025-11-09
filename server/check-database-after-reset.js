async function checkDatabaseAfterReset() {
  console.log('🔍 فحص قاعدة البيانات بعد Reset...\n');
  
  try {
    const db = require('./services/databaseService');
    
    // فحص المهام الحالية
    console.log('📊 فحص المهام المجدولة...');
    const tasks = await db.getScheduledTasks();
    console.log(`عدد المهام: ${tasks.length}`);
    
    if (tasks.length > 0) {
      console.log('📋 عينة من المهام:');
      tasks.slice(0, 3).forEach((task, i) => {
        console.log(`  ${i+1}. ${task.CustomerName} - ${task.Day} - ${task.Time} - ${task.CarPlate}`);
      });
    }
    
    // فحص العملاء
    console.log('\n👥 فحص العملاء...');
    const customers = await db.getCustomers();
    console.log(`عدد العملاء: ${customers.length}`);
    
    // فحص العمال
    console.log('\n👷 فحص العمال...');
    const workers = await db.getWorkers();
    console.log(`عدد العمال: ${workers.length}`);
    
    console.log('\n🎯 الخلاصة:');
    if (tasks.length === 0) {
      console.log('✅ قاعدة البيانات فارغة - Reset نجح');
    } else {
      console.log('❌ قاعدة البيانات لا تزال تحتوي على مهام - Reset فشل');
      console.log('🔧 المشكلة قد تكون في:');
      console.log('  - الاتصال بين الواجهة والخادم');
      console.log('  - عدم وصول طلب Reset للخادم');
      console.log('  - خطأ في دالة clearAndWriteSchedule');
    }
    
  } catch (error) {
    console.error('❌ خطأ في الفحص:', error.message);
  }
}

checkDatabaseAfterReset().then(() => {
  console.log('\n🎉 انتهى الفحص');
  process.exit(0);
}).catch(error => {
  console.error('❌ فشل الفحص:', error);
  process.exit(1);
});