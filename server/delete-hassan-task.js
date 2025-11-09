const db = require('./services/databaseService');

async function deleteHassanTask() {
  console.log('🗑️ حذف مهمة Hassan...\n');
  
  const taskData = {
    CustomerID: 'CUST-035',
    Day: 'Friday',
    Time: '6:00 AM',
    CarPlate: 'VW'
  };
  
  console.log('📋 بيانات المهمة:');
  console.log('  CustomerID:', taskData.CustomerID);
  console.log('  CustomerName: Hassan');
  console.log('  Day:', taskData.Day);
  console.log('  Time:', taskData.Time);
  console.log('  CarPlate:', taskData.CarPlate);
  console.log('  Villa: P1 006');
  console.log();
  
  try {
    // 1. التحقق من وجود المهمة
    console.log('1️⃣ البحث عن المهمة...');
    const allTasks = await db.getScheduledTasks();
    const targetTask = allTasks.find(task => 
      task.CustomerID === taskData.CustomerID &&
      task.Day === taskData.Day &&
      task.Time === taskData.Time &&
      task.CarPlate === taskData.CarPlate
    );
    
    if (!targetTask) {
      console.log('❌ المهمة غير موجودة');
      return;
    }
    
    console.log('✅ تم العثور على المهمة:');
    console.log(`  ${targetTask.CustomerName} - ${targetTask.Villa} - ${targetTask.CarPlate}`);
    console.log(`  isLocked: ${targetTask.isLocked}`);
    console.log();
    
    // 2. حذف المهمة
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
      console.log('❌ المهمة لا تزال موجودة');
    } else {
      console.log('✅ تأكيد: تم حذف مهمة Hassan بنجاح!');
      console.log(`📊 إجمالي المهام الآن: ${updatedTasks.length}`);
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

deleteHassanTask().then(() => {
  console.log('\n🎉 انتهت العملية');
  process.exit(0);
}).catch(error => {
  console.error('❌ فشل:', error);
  process.exit(1);
});