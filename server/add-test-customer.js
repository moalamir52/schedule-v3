// Add test customer directly to Supabase
const supabase = require('./services/supabaseService');

async function addTestCustomer() {
  try {
    const testCustomer = {
      CustomerID: 'CUST-001',
      Name: 'Test Customer',
      Villa: 'Villa 1',
      Status: 'Active',
      Phone: '123456789',
      CarPlates: 'ABC123',
      Days: 'Monday',
      Time: '10:00 AM',
      Fee: 100,
      'Number of car': 1,
      'start date': '1-Nov-24'
    };
    
    const result = await supabase.addCustomer(testCustomer);
    console.log('✅ Test customer added:', result);
    
    // Verify
    const customers = await supabase.getCustomers();
    console.log('📊 Total customers:', customers.length);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addTestCustomer();