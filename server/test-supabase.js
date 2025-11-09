// Test Supabase database connection and data
const supabaseService = require('./services/supabaseService');

async function testSupabase() {
  console.log('🧪 Testing Supabase Database Connection');
  console.log('=====================================');
  
  try {
    // Test 1: Get Customers
    console.log('\n📋 Testing Customers...');
    const customers = await supabaseService.getCustomers();
    console.log(`✅ Found ${customers.length} customers`);
    if (customers.length > 0) {
      console.log(`   First customer: ${customers[0].Name} (${customers[0].CustomerID})`);
    }
    
    // Test 2: Get Workers
    console.log('\n👷 Testing Workers...');
    const workers = await supabaseService.getWorkers();
    console.log(`✅ Found ${workers.length} workers`);
    if (workers.length > 0) {
      console.log(`   First worker: ${workers[0].Name} (${workers[0].WorkerID})`);
    }
    
    // Test 3: Get Invoices
    console.log('\n💰 Testing Invoices...');
    const invoices = await supabaseService.getInvoices();
    console.log(`✅ Found ${invoices.length} invoices`);
    
    // Test 4: Get History
    console.log('\n🧼 Testing Wash History...');
    const history = await supabaseService.getAllHistory();
    console.log(`✅ Found ${history.length} history records`);
    
    // Test 5: Get Services
    console.log('\n🛠️ Testing Services...');
    const services = await supabaseService.getServices();
    console.log(`✅ Found ${services.length} services`);
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Customers: ${customers.length}`);
    console.log(`   - Workers: ${workers.length}`);
    console.log(`   - Invoices: ${invoices.length}`);
    console.log(`   - History: ${history.length}`);
    console.log(`   - Services: ${services.length}`);
    
    if (customers.length > 0 && workers.length > 0) {
      console.log('\n✅ Database is working and has data!');
    } else {
      console.log('\n⚠️ Database is connected but missing data');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run test
testSupabase();