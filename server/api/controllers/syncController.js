const db = require('../../services/databaseService');

// دالة لمزامنة WorkerID مع WorkerName في الجدول
const syncWorkerIds = async (req, res) => {
  try {
    // الحصول على جميع العمال من قاعدة البيانات
    const workers = await db.getWorkers();
    
    // إنشاء خريطة لربط أسماء العمال بمعرفاتهم
    const workerMap = {};
    workers.forEach(worker => {
      workerMap[worker.Name] = worker.WorkerID;
    });
    
    // الحصول على جميع المهام المجدولة
    const scheduledTasks = await db.getScheduledTasks();
    
    let updatedCount = 0;
    const updates = [];
    
    // فحص كل مهمة والتأكد من تطابق WorkerName مع WorkerID
    for (const task of scheduledTasks) {
      if (task.WorkerName && workerMap[task.WorkerName]) {
        const correctWorkerId = workerMap[task.WorkerName];
        
        // إذا كان WorkerID غير صحيح، أضفه لقائمة التحديثات
        if (task.WorkerID !== correctWorkerId) {
          updates.push({
            customerID: task.CustomerID,
            day: task.Day,
            time: task.Time,
            carPlate: task.CarPlate || '',
            correctWorkerId: correctWorkerId,
            currentWorkerId: task.WorkerID,
            workerName: task.WorkerName
          });
        }
      }
    }
    
    // تطبيق التحديثات
    for (const update of updates) {
      try {
        await db.updateScheduledTask(
          update.customerID,
          update.day,
          update.time,
          update.carPlate,
          { WorkerID: update.correctWorkerId }
        );
        updatedCount++;
        console.log(`Updated ${update.customerID} - ${update.carPlate}: ${update.currentWorkerId} → ${update.correctWorkerId}`);
      } catch (error) {
        console.error(`Failed to update task for ${update.customerID}:`, error.message);
      }
    }
    
    res.json({
      success: true,
      message: `تم تحديث ${updatedCount} مهمة بنجاح`,
      totalChecked: scheduledTasks.length,
      updatesNeeded: updates.length,
      updatesApplied: updatedCount,
      workerMapping: workerMap,
      updates: updates.map(u => ({
        customer: u.customerID,
        car: u.carPlate,
        worker: u.workerName,
        oldId: u.currentWorkerId,
        newId: u.correctWorkerId
      }))
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'فشل في مزامنة معرفات العمال',
      details: error.message
    });
  }
};

// دالة لإصلاح مهمة واحدة محددة
const fixSingleTask = async (req, res) => {
  try {
    const { customerID, day, time, carPlate } = req.body;
    
    if (!customerID || !day || !time) {
      return res.status(400).json({
        success: false,
        error: 'CustomerID, Day, and Time are required'
      });
    }
    
    // الحصول على المهمة الحالية
    const tasks = await db.getScheduledTasks();
    const task = tasks.find(t => 
      t.CustomerID === customerID && 
      t.Day === day && 
      t.Time === time && 
      (t.CarPlate || '') === (carPlate || '')
    );
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }
    
    // الحصول على العمال
    const workers = await db.getWorkers();
    const worker = workers.find(w => w.Name === task.WorkerName);
    
    if (!worker) {
      return res.status(404).json({
        success: false,
        error: `Worker '${task.WorkerName}' not found in workers database`
      });
    }
    
    // تحديث WorkerID
    await db.updateScheduledTask(customerID, day, time, carPlate || '', {
      WorkerID: worker.WorkerID
    });
    
    res.json({
      success: true,
      message: 'تم إصلاح المهمة بنجاح',
      task: {
        customerID,
        day,
        time,
        carPlate: carPlate || '',
        workerName: task.WorkerName,
        oldWorkerId: task.WorkerID,
        newWorkerId: worker.WorkerID
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'فشل في إصلاح المهمة',
      details: error.message
    });
  }
};

module.exports = {
  syncWorkerIds,
  fixSingleTask
};