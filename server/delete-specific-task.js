const db = require('./services/databaseService');

async function deleteSpecificTask() {
  console.log('🗑️ حذف مهمة محددة...\n');
  
  // بيانات المهمة المطلوب حذفها
  const taskData = {
    CustomerID: 'CUST-018',
    Day: 'Friday',
    Time: '6:00 AM',
    CarPlate: 'BMW'
  };
  
  console.log('📋 بيانات المهمة:');
  console.log('  CustomerID:', taskData.CustomerID);
  console.log('  Day:', taskData.Day);
  console.log('  Time:', taskData.Time);
  console.log('  CarPlate:', taskData.CarPlate);
  console.log();
  
  try {
    // 1. التحقق من وجود المهمة أولاً
    console.log('1️⃣ البحث عن المهمة...');
    const allTasks = await db.getScheduledTasks();
    const targetTask = allTasks.find(task => 
      task.CustomerID === taskData.CustomerID &&
      task.Day === taskData.Day &&
      task.Time === taskData.Time &&
      task.CarPlate === taskData.CarPlate
    );
    
    if (!targetTask) {
      console.log('❌ المهمة غير موجودة في قاعدة البيانات');
      return;
    }
    
    console.log('✅ تم العثور على المهمة:');
    console.log('  CustomerName:', targetTask.CustomerName);
    console.log('  Villa:', targetTask.Villa);
    console.log('  WorkerName:', targetTask.WorkerName);
    console.log();
    
    // 2. حذف المهمة باستخدام الطريقة المحسنة
    console.log('2️⃣ حذف المهمة...');
    const taskId = `${taskData.CustomerID}-${taskData.Day}-${taskData.Time}-${taskData.CarPlate}`;
    console.log('🎯 TaskID:', taskId);
    
    const success = await db.completeTaskOptimized(taskId);
    
    if (success) {
      console.log('✅ تم حذف المهمة بنجاح!');
    } else {
      console.log('❌ فشل في حذف المهمة');
    }
    
    // 3. التحقق من الحذف
    console.log('\n3️⃣ التحقق من الحذف...');
    const updatedTasks = await db.getScheduledTasks();
    const stillExists = updatedTasks.find(task => 
      task.CustomerID === taskData.CustomerID &&
      task.Day === taskData.Day &&
      task.Time === taskData.Time &&
      task.CarPlate === taskData.CarPlate
    );
    
    if (stillExists) {
      console.log('⚠️ المهمة لا تزال موجودة - الحذف لم يتم');
      console.log('🔄 محاولة الحذف المباشر...');
      
      // محاولة الحذف المباشر
      await db.deleteScheduledTask(
        taskData.CustomerID,
        taskData.Day, 
        taskData.Time,
        taskData.CarPlate
      );
      
      // فحص نهائي
      const finalTasks = await db.getScheduledTasks();
      const finalCheck = finalTasks.find(task => 
        task.CustomerID === taskData.CustomerID &&
        task.Day === taskData.Day &&
        task.Time === taskData.Time &&
        task.CarPlate === taskData.CarPlate
      );
      
      if (finalCheck) {
        console.log('❌ الحذف المباشر فشل أيضاً');
      } else {
        console.log('✅ تم الحذف بالطريقة المباشرة!');
      }
    } else {
      console.log('✅ تأكيد: المهمة تم حذفها من قاعدة البيانات');
    }
    
  } catch (error) {
    console.error('❌ خطأ في العملية:', error);
  }
}

// تشغيل الاختبار
deleteSpecificTask().then(() => {
  console.log('\n🎉 انتهت العملية');
  process.exit(0);
}).catch(error => {
  console.error('❌ فشل في العملية:', error);
  process.exit(1);
});