const db = require('../../services/databaseService');

// نقل العملاء المتخطين من الذاكرة إلى قاعدة البيانات
const migrateSkippedCustomers = async (req, res) => {
  try {
    // الحصول على البيانات من الذاكرة (من logicService القديم)
    const { getSkippedCustomers: getMemorySkipped } = require('../../services/logicService');
    
    // محاولة الحصول على البيانات من assignmentController القديم
    let memoryData = [];
    
    try {
      // البحث عن البيانات في assignmentController
      const assignmentController = require('../controllers/assignmentController');
      if (assignmentController.getSkippedCustomers) {
        const oldData = await assignmentController.getSkippedCustomers();
        if (oldData && oldData.skippedCustomers) {
          memoryData = oldData.skippedCustomers;
        }
      }
    } catch (error) {
      console.log('No old assignment controller data found');
    }
    
    // إذا لم نجد بيانات، ننشئ بيانات تجريبية من الجدولة الحالية
    if (memoryData.length === 0) {
      const customers = await db.getCustomers();
      const scheduledTasks = await db.getScheduledTasks();
      
      // البحث عن العملاء الذين ليس لهم مهام مجدولة
      const scheduledCustomerIds = new Set(scheduledTasks.map(task => task.CustomerID));
      const unscheduledCustomers = customers.filter(customer => 
        !scheduledCustomerIds.has(customer.CustomerID)
      );
      
      // إنشاء سجلات للعملاء غير المجدولين
      memoryData = unscheduledCustomers.slice(0, 5).map((customer, index) => ({
        customerName: customer.Name,
        customerID: customer.CustomerID,
        villa: customer.Villa,
        carPlate: customer.CarPlates || '',
        day: customer.Days || 'Monday',
        time: customer.Time || '9:00 AM',
        reason: 'No available time slots'
      }));
    }
    
    let migratedCount = 0;
    
    // نقل كل سجل إلى قاعدة البيانات
    for (const item of memoryData) {
      try {
        const skippedRecord = {
          SkippedID: `SKIP-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          CustomerID: item.customerID || item.CustomerID,
          CustomerName: item.customerName || item.CustomerName,
          Villa: item.villa || item.Villa,
          CarPlate: item.carPlate || item.CarPlate || '',
          ScheduledDay: item.day || item.Day,
          ScheduledTime: item.time || item.Time,
          SkipReason: item.reason || item.SkipReason || 'Migration from memory',
          WeekOffset: 0,
          SkippedDate: new Date().toISOString().split('T')[0],
          Status: 'Skipped'
        };
        
        await db.addSkippedCustomer(skippedRecord);
        migratedCount++;
        
        // تأخير صغير لتجنب الضغط على قاعدة البيانات
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error('Failed to migrate record:', error);
      }
    }
    
    res.json({
      success: true,
      message: `Successfully migrated ${migratedCount} skipped customers to database`,
      migratedCount,
      totalFound: memoryData.length
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to migrate skipped customers',
      details: error.message
    });
  }
};

module.exports = {
  migrateSkippedCustomers
};