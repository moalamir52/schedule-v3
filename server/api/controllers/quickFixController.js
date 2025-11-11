// حل سريع لإضافة العملاء المتخطين مباشرة للذاكرة
let tempSkippedCustomers = [
  {
    customerName: 'Ahmed Ali',
    customerId: 'CUST-001',
    villa: 'A123',
    carPlate: 'BMW X5',
    day: 'Monday',
    time: '9:00 AM',
    reason: 'No available workers'
  },
  {
    customerName: 'Sara Mohamed', 
    customerId: 'CUST-002',
    villa: 'B456',
    carPlate: 'Mercedes C200',
    day: 'Tuesday',
    time: '10:00 AM',
    reason: 'Time slot conflict'
  },
  {
    customerName: 'Omar Hassan',
    customerId: 'CUST-003', 
    villa: 'C789',
    carPlate: 'Toyota Camry',
    day: 'Wednesday',
    time: '2:00 PM',
    reason: 'Customer unavailable'
  }
];

const getQuickSkippedCustomers = async (req, res) => {
  res.json({
    success: true,
    skippedCustomers: tempSkippedCustomers,
    totalSkipped: tempSkippedCustomers.length
  });
};

module.exports = {
  getQuickSkippedCustomers
};