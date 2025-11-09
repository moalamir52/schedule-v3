async function checkCustomerData() {
  console.log('🔍 فحص بيانات العملاء...\n');
  
  try {
    const db = require('./services/databaseService');
    const customers = await db.getCustomers();
    
    console.log(`📊 إجمالي العملاء: ${customers.length}\n`);
    
    // فحص عينة من العملاء
    console.log('📋 عينة من بيانات العملاء:');
    customers.slice(0, 5).forEach((customer, i) => {
      console.log(`\n${i+1}. ${customer.Name} (${customer.CustomerID})`);
      console.log(`   Villa: ${customer.Villa}`);
      console.log(`   Days: ${customer.Days}`);
      console.log(`   Time: ${customer.Time}`);
      console.log(`   CarPlates: ${customer.CarPlates}`);
      console.log(`   Washman_Package: ${customer.Washman_Package}`);
      console.log(`   Status: ${customer.Status}`);
    });
    
    // تحليل أنواع البيانات
    console.log('\n📊 تحليل البيانات:');
    
    const daysFormats = [...new Set(customers.map(c => c.Days).filter(d => d))];
    console.log('أشكال Days:', daysFormats.slice(0, 10));
    
    const timeFormats = [...new Set(customers.map(c => c.Time).filter(t => t))];
    console.log('أشكال Time:', timeFormats.slice(0, 10));
    
    const packageFormats = [...new Set(customers.map(c => c.Washman_Package).filter(p => p))];
    console.log('أشكال Package:', packageFormats.slice(0, 10));
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

checkCustomerData().then(() => {
  console.log('\n🎉 انتهى الفحص');
  process.exit(0);
}).catch(error => {
  console.error('❌ فشل الفحص:', error);
  process.exit(1);
});