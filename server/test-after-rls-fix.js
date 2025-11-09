const db = require('./services/databaseService');

async function testAfterRLSFix() {
  console.log('🧪 اختبار بعد إصلاح RLS...\n');
  
  try {
    // 1. اختبار القراءة
    console.log('1️⃣ اختبار القراءة...');
    const tasks = await db.getScheduledTasks();
    console.log(`✅ تم جلب ${tasks.length} مهمة`);
    
    if (tasks.length > 0) {
      // 2. اختبار الحذف
      const testTask = tasks.find(t => 
        t.CustomerID === 'CUST-018' && 
        t.Day === 'Friday' && 
        t.Time === '6:00 AM' && 
        t.CarPlate === 'BMW'
      );
      
      if (testTask) {
        console.log('\n2️⃣ اختبار الحذف...');
        const taskId = `${testTask.CustomerID}-${testTask.Day}-${testTask.Time}-${testTask.CarPlate}`;
        
        const success = await db.completeTaskOptimized(taskId);
        
        if (success) {
          console.log('✅ الحذف نجح!');
        } else {
          console.log('❌ الحذف فشل');
        }
        
        // 3. التحقق
        console.log('\n3️⃣ التحقق...');
        const updatedTasks = await db.getScheduledTasks();
        console.log(`📊 المهام الآن: ${updatedTasks.length}`);
        
        const stillExists = updatedTasks.find(t => 
          t.CustomerID === 'CUST-018' && 
          t.Day === 'Friday' && 
          t.Time === '6:00 AM' && 
          t.CarPlate === 'BMW'
        );
        
        if (stillExists) {
          console.log('❌ المهمة لا تزال موجودة');
        } else {
          console.log('✅ تم حذف المهمة بنجاح!');
        }
      } else {
        console.log('ℹ️ المهمة المستهدفة غير موجودة');
      }
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

testAfterRLSFix().then(() => {
  console.log('\n🎉 انتهى الاختبار');
  process.exit(0);
}).catch(error => {
  console.error('❌ فشل الاختبار:', error);
  process.exit(1);
});