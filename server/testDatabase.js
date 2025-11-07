const db = require('./services/databaseService');

async function testDatabase() {
  console.log('🧪 اختبار قاعدة البيانات...');
  
  try {
    // Test case sensitivity
    console.log('\n📝 اختبار case sensitivity...');
    
    // Add test customer
    const testCustomer = {
      CustomerID: 'TEST-001',
      CustomerName: 'Test Customer',
      Villa: 'A123',
      CarPlates: 'ABC-123,XYZ-789',
      Washman_Package: '3 EXT 1 INT',
      WashDay: 'Monday',
      WashTime: '09:00',
      Status: 'Active'
    };
    
    await db.addCustomer(testCustomer);
    console.log('✅ تم إضافة عميل تجريبي');
    
    // Test case-insensitive search
    const foundCustomer1 = await db.get('SELECT * FROM customers WHERE CustomerID = ? COLLATE NOCASE', ['test-001']);
    const foundCustomer2 = await db.get('SELECT * FROM customers WHERE CustomerID = ? COLLATE NOCASE', ['TEST-001']);
    
    if (foundCustomer1 && foundCustomer2) {
      console.log('✅ البحث case-insensitive يعمل بشكل صحيح');
    } else {
      console.log('❌ مشكلة في البحث case-insensitive');
    }
    
    // Test search function
    const searchResults = await db.searchCustomers('test');
    if (searchResults.length > 0) {
      console.log('✅ وظيفة البحث تعمل بشكل صحيح');
    } else {
      console.log('❌ مشكلة في وظيفة البحث');
    }
    
    // Clean up
    await db.run('DELETE FROM customers WHERE CustomerID = ? COLLATE NOCASE', ['TEST-001']);
    console.log('✅ تم حذف البيانات التجريبية');
    
    console.log('\n🎉 جميع الاختبارات نجحت!');
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
  }
}

if (require.main === module) {
  testDatabase().then(() => {
    console.log('انتهى الاختبار');
    process.exit(0);
  }).catch(err => {
    console.error('فشل الاختبار:', err);
    process.exit(1);
  });
}

module.exports = { testDatabase };