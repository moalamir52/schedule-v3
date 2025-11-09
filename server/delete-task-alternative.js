const db = require('./services/databaseService');

async function deleteTaskAlternative() {
  console.log('🔄 حذف المهمة بالطريقة البديلة...\n');
  
  const targetTask = {
    CustomerID: 'CUST-018',
    Day: 'Friday', 
    Time: '6:00 AM',
    CarPlate: 'BMW'
  };
  
  try {
    // 1. جلب جميع المهام
    console.log('1️⃣ جلب جميع المهام...');
    const allTasks = await db.getScheduledTasks();
    console.log(`📊 إجمالي المهام: ${allTasks.length}`);
    
    // 2. البحث عن المهمة المطلوب حذفها
    const taskToDelete = allTasks.find(task => 
      task.CustomerID === targetTask.CustomerID &&
      task.Day === targetTask.Day &&
      task.Time === targetTask.Time &&
      task.CarPlate === targetTask.CarPlate
    );
    
    if (!taskToDelete) {
      console.log('❌ المهمة غير موجودة');
      return;
    }
    
    console.log('✅ تم العثور على المهمة:');
    console.log(`  ${taskToDelete.CustomerName} - ${taskToDelete.Villa} - ${taskToDelete.CarPlate}`);
    
    // 3. إنشاء قائمة جديدة بدون المهمة المحذوفة
    const remainingTasks = allTasks.filter(task => 
      !(task.CustomerID === targetTask.CustomerID &&
        task.Day === targetTask.Day &&
        task.Time === targetTask.Time &&
        task.CarPlate === targetTask.CarPlate)
    );
    
    console.log(`📊 المهام المتبقية: ${remainingTasks.length}`);
    console.log(`🗑️ سيتم حذف: ${allTasks.length - remainingTasks.length} مهمة`);
    
    // 4. إعادة كتابة الجدول بدون المهمة المحذوفة
    console.log('\n2️⃣ إعادة كتابة الجدول...');
    
    const updatedSchedule = remainingTasks.map(task => ({
      day: task.Day,
      appointmentDate: task.AppointmentDate || '',
      time: task.Time,
      customerId: task.CustomerID,
      customerName: task.CustomerName,
      villa: task.Villa,
      carPlate: task.CarPlate,
      washType: task.WashType,
      workerName: task.WorkerName,
      workerId: task.WorkerID,
      packageType: task.PackageType || '',
      isLocked: task.isLocked || 'FALSE',
      scheduleDate: task.ScheduleDate || new Date().toISOString().split('T')[0]
    }));
    
    await db.clearAndWriteSchedule(updatedSchedule);
    
    // 5. التحقق من النتيجة
    console.log('\n3️⃣ التحقق من النتيجة...');
    const finalTasks = await db.getScheduledTasks();
    
    const stillExists = finalTasks.find(task => 
      task.CustomerID === targetTask.CustomerID &&
      task.Day === targetTask.Day &&
      task.Time === targetTask.Time &&
      task.CarPlate === targetTask.CarPlate
    );
    
    if (stillExists) {
      console.log('❌ المهمة لا تزال موجودة - فشل الحذف');
    } else {
      console.log('✅ تم حذف المهمة بنجاح!');
      console.log(`📊 إجمالي المهام الآن: ${finalTasks.length}`);
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

deleteTaskAlternative().then(() => {
  console.log('\n🎉 انتهت العملية');
  process.exit(0);
}).catch(error => {
  console.error('❌ فشل:', error);
  process.exit(1);
});