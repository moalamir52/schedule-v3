const db = require('../../services/databaseService');

// إضافة عميل متخطي إلى قاعدة البيانات
const addSkippedCustomer = async (req, res) => {
  try {
    const { customerID, customerName, villa, carPlate, day, time, reason, weekOffset } = req.body;
    
    const skippedRecord = {
      SkippedID: `SKIP-${Date.now()}`,
      CustomerID: customerID,
      CustomerName: customerName,
      Villa: villa,
      CarPlate: carPlate || '',
      ScheduledDay: day,
      ScheduledTime: time,
      SkipReason: reason,
      WeekOffset: weekOffset || 0,
      SkippedDate: new Date().toISOString().split('T')[0],
      Status: 'Skipped'
    };
    
    await db.addSkippedCustomer(skippedRecord);
    
    res.json({
      success: true,
      message: 'Skipped customer recorded successfully',
      record: skippedRecord
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to record skipped customer',
      details: error.message
    });
  }
};

// جلب جميع العملاء المتخطين
const getSkippedCustomers = async (req, res) => {
  try {
    const { weekOffset, day, limit } = req.query;
    
    let skippedCustomers = await db.getSkippedCustomers();
    console.log('🎯 Controller - Raw DB results:', skippedCustomers);
    
    // فلترة حسب الأسبوع إذا تم تحديده
    if (weekOffset !== undefined) {
      skippedCustomers = skippedCustomers.filter(record => 
        record.WeekOffset === parseInt(weekOffset)
      );
    }
    
    // فلترة حسب اليوم إذا تم تحديده
    if (day) {
      skippedCustomers = skippedCustomers.filter(record => 
        record.ScheduledDay === day
      );
    }
    
    // تحديد عدد النتائج
    if (limit) {
      skippedCustomers = skippedCustomers.slice(0, parseInt(limit));
    }
    
    // تحويل أسماء الحقول للشكل المتوقع في الواجهة
    const formattedCustomers = skippedCustomers.map(customer => ({
      customerName: customer.CustomerName,
      customerId: customer.CustomerID,
      villa: customer.Villa,
      carPlate: customer.CarPlate,
      day: customer.ScheduledDay,
      time: customer.ScheduledTime,
      reason: customer.SkipReason,
      skippedDate: customer.SkippedDate,
      status: customer.Status
    }));
    
    console.log('📤 Controller - Sending formatted response:', formattedCustomers);
    
    // عرض العملاء المتخطين في شكل قابل للنسخ
    if (formattedCustomers.length > 0) {
      console.log('\n=== العملاء المتخطين ===');
      formattedCustomers.forEach((customer, index) => {
        console.log(`${index + 1}. ${customer.customerName} - ${customer.villa} - ${customer.carPlate} - ${customer.day} ${customer.time} - ${customer.reason}`);
      });
      console.log('========================\n');
    }
    
    res.json({
      success: true,
      skippedCustomers: formattedCustomers,
      totalCount: formattedCustomers.length,
      message: `Found ${formattedCustomers.length} skipped customers`
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch skipped customers',
      details: error.message
    });
  }
};

// حذف سجل عميل متخطي
const deleteSkippedCustomer = async (req, res) => {
  try {
    const { skippedId } = req.params;
    
    await db.deleteSkippedCustomer(skippedId);
    
    res.json({
      success: true,
      message: 'Skipped customer record deleted successfully'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete skipped customer record',
      details: error.message
    });
  }
};

// مسح جميع سجلات العملاء المتخطين
const clearAllSkippedCustomers = async (req, res) => {
  try {
    await db.clearAllSkippedCustomers();
    
    res.json({
      success: true,
      message: 'All skipped customer records cleared successfully'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to clear skipped customer records',
      details: error.message
    });
  }
};

module.exports = {
  addSkippedCustomer,
  getSkippedCustomers,
  deleteSkippedCustomer,
  clearAllSkippedCustomers
};