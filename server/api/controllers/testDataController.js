const db = require('../../services/databaseService');

// إضافة بيانات تجريبية للعملاء المتخطين
const addTestSkippedCustomers = async (req, res) => {
  try {
    const testData = [
      {
        SkippedID: `SKIP-${Date.now()}-001`,
        CustomerID: 'CUST-001',
        CustomerName: 'Ahmed Ali',
        Villa: 'A123',
        CarPlate: 'BMW X5',
        ScheduledDay: 'Monday',
        ScheduledTime: '9:00 AM',
        SkipReason: 'No available workers',
        WeekOffset: 0,
        SkippedDate: new Date().toISOString().split('T')[0],
        Status: 'Skipped'
      },
      {
        SkippedID: `SKIP-${Date.now()}-002`,
        CustomerID: 'CUST-002', 
        CustomerName: 'Sara Mohamed',
        Villa: 'B456',
        CarPlate: 'Mercedes C200',
        ScheduledDay: 'Tuesday',
        ScheduledTime: '10:00 AM',
        SkipReason: 'Time slot conflict',
        WeekOffset: 0,
        SkippedDate: new Date().toISOString().split('T')[0],
        Status: 'Skipped'
      },
      {
        SkippedID: `SKIP-${Date.now()}-003`,
        CustomerID: 'CUST-003',
        CustomerName: 'Omar Hassan',
        Villa: 'C789',
        CarPlate: 'Toyota Camry',
        ScheduledDay: 'Wednesday',
        ScheduledTime: '2:00 PM',
        SkipReason: 'Customer unavailable',
        WeekOffset: 0,
        SkippedDate: new Date().toISOString().split('T')[0],
        Status: 'Skipped'
      }
    ];

    let addedCount = 0;
    for (const record of testData) {
      try {
        await db.addSkippedCustomer(record);
        addedCount++;
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('Failed to add test record:', error);
      }
    }

    res.json({
      success: true,
      message: `Added ${addedCount} test skipped customers`,
      addedCount,
      testData
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to add test data',
      details: error.message
    });
  }
};

module.exports = {
  addTestSkippedCustomers
};