// Test all APIs systematically
const BASE_URL = 'https://schedule-v3-server.onrender.com';

const tests = [
  // Basic tests
  { name: 'Server Health', url: '/api/test-server' },
  { name: 'Environment Check', url: '/api/env-check' },
  { name: 'Supabase Connection', url: '/api/test-supabase' },
  
  // Data APIs
  { name: 'Get Customers', url: '/api/clients' },
  { name: 'Get Workers', url: '/api/workers' },
  { name: 'Get Services', url: '/api/services' },
  { name: 'Get Invoices', url: '/api/invoices' },
  
  // Schedule APIs
  { name: 'Get Schedule', url: '/api/schedule/assign/current' },
  { name: 'Get Overview', url: '/api/schedule/overview' },
  
  // Other APIs
  { name: 'Get Next Customer ID', url: '/api/clients/next-id' },
  { name: 'Database Info', url: '/api/database-info' },
];

async function testAPI(test) {
  try {
    const response = await fetch(`${BASE_URL}${test.url}`);
    const data = await response.json();
    
    if (response.ok) {
      const dataCount = Array.isArray(data?.data) ? data.data.length : 
                       Array.isArray(data) ? data.length : 
                       data?.success ? 'OK' : 'Unknown';
      
      console.log(`✅ ${test.name}: ${response.status} - ${dataCount}`);
      return { name: test.name, status: 'PASS', data: dataCount };
    } else {
      console.log(`❌ ${test.name}: ${response.status} - ${data.error || 'Error'}`);
      return { name: test.name, status: 'FAIL', error: data.error };
    }
  } catch (error) {
    console.log(`💥 ${test.name}: Network Error - ${error.message}`);
    return { name: test.name, status: 'ERROR', error: error.message };
  }
}

async function runAllTests() {
  console.log('🚀 Starting comprehensive API tests...\n');
  
  const results = [];
  
  for (const test of tests) {
    const result = await testAPI(test);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait between tests
  }
  
  console.log('\n📊 Test Summary:');
  console.log('================');
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const errors = results.filter(r => r.status === 'ERROR').length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`💥 Errors: ${errors}`);
  console.log(`📈 Success Rate: ${Math.round((passed / results.length) * 100)}%`);
  
  console.log('\n🔍 Detailed Results:');
  results.forEach(r => {
    const status = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '💥';
    console.log(`${status} ${r.name}: ${r.data || r.error || 'Unknown'}`);
  });
}

runAllTests();