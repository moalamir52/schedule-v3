async function forceResetDatabase() {
  console.log('🔥 إجبار إعادة تعيين قاعدة البيانات...\n');
  
  try {
    const db = require('./services/databaseService');
    
    // 1. فحص المهام الحالية
    console.log('1️⃣ فحص المهام الحالية...');
    const currentTasks = await db.getScheduledTasks();
    console.log(`📊 المهام الحالية: ${currentTasks.length}`);
    
    // 2. حذف جميع المهام
    console.log('\n2️⃣ حذف جميع المهام...');
    await db.clearAndWriteSchedule([]);
    console.log('✅ تم حذف جميع المهام');
    
    // 3. التحقق من الحذف
    console.log('\n3️⃣ التحقق من الحذف...');
    const afterClear = await db.getScheduledTasks();
    console.log(`📊 المهام بعد الحذف: ${afterClear.length}`);
    
    if (afterClear.length === 0) {
      console.log('✅ تم حذف جميع المهام بنجاح');
      
      // 4. إعادة بناء الجدولة
      console.log('\n4️⃣ إعادة بناء الجدولة...');
      const { buildWeeklySchedule } = require('./services/logicService');
      const newSchedule = await buildWeeklySchedule();
      console.log(`📋 تم إنشاء ${newSchedule.length} مهمة جديدة`);
      
      // 5. حفظ الجدولة الجديدة
      console.log('\n5️⃣ حفظ الجدولة الجديدة...');
      await db.clearAndWriteSchedule(newSchedule);
      console.log('✅ تم حفظ الجدولة الجديدة');
      
      // 6. التحقق النهائي
      console.log('\n6️⃣ التحقق النهائي...');
      const finalTasks = await db.getScheduledTasks();
      console.log(`📊 المهام النهائية: ${finalTasks.length}`);
      
      console.log('\n🎉 تم إعادة تعيين قاعدة البيانات بنجاح!');
      
    } else {
      console.log('❌ فشل في حذف المهام');
    }
    
  } catch (error) {
    console.error('❌ خطأ في إعادة التعيين:', error.message);
  }
}

forceResetDatabase().then(() => {
  console.log('\n✅ انتهت العملية');
  process.exit(0);
}).catch(error => {
  console.error('❌ فشلت العملية:', error);
  process.exit(1);
});