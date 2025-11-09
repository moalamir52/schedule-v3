// Test 10 main database tables/endpoints
const BASE_URL = 'https://schedule-v3-server.onrender.com';

const tableTests = [
  // Core data tables
  { name: 'Customers', url: '/api/clients', expectedMin: 50 },
  { name: 'Workers', url: '/api/workers', expectedMin: 1 },
  { name: 'Services', url: '/api/services', expectedMin: 0 },
  { name: 'Invoices', url: '/api/invoices', expectedMin: 0 },
  
  // Schedule tables
  { name: 'Current Schedule', url: '/api/schedule/assign/current', expectedMin: 0 },
  { name: 'Schedule Overview', url: '/api/schedule/overview', expectedMin: 0 },
  
  // System tables
  { name: 'Users', url: '/api/users', expectedMin: 0 },
  { name: 'Wash Rules', url: '/api/wash-rules', expectedMin: 0 },
  { name: 'Completed Tasks', url: '/api/completed-tasks', expectedMin: 0 },
  { name: 'Audit Logs', url: '/api/audit', expectedMin: 0 }
];

async function testTable(test) {
  try {
    console.log(`🔍 Testing ${test.name}...`);
    
    const response = await fetch(`${BASE_URL}${test.url}`);
    const data = await response.json();
    
    if (!response.ok) {
      return {
        name: test.name,
        status: 'FAIL',
        error: `HTTP ${response.status}: ${data.error || data.message || 'Unknown error'}`,
        count: 0
      };
    }
    
    // Extract count from different response formats
    let count = 0;
    if (Array.isArray(data)) {
      count = data.length;
    } else if (Array.isArray(data?.data)) {
      count = data.data.length;
    } else if (data?.success && Array.isArray(data?.result)) {
      count = data.result.length;
    } else if (data?.success) {
      count = 'OK';
    } else {
      count = 'Unknown';
    }
    
    const status = (typeof count === 'number' && count >= test.expectedMin) || count === 'OK' ? 'PASS' : 'WARN';
    
    return {
      name: test.name,
      status: status,
      count: count,
      expected: test.expectedMin
    };
    
  } catch (error) {
    return {
      name: test.name,
      status: 'ERROR',
      error: error.message,
      count: 0
    };
  }
}

async function testAllTables() {
  console.log('🚀 Testing 10 Main Database Tables...\n');
  console.log('=' .repeat(50));
  
  const results = [];
  
  for (const test of tableTests) {
    const result = await testTable(test);
    results.push(result);
    
    const statusIcon = result.status === 'PASS' ? '✅' : 
                      result.status === 'WARN' ? '⚠️' : 
                      result.status === 'FAIL' ? '❌' : '💥';
    
    const countText = typeof result.count === 'number' ? 
                     `${result.count} records` : 
                     result.count;
    
    console.log(`${statusIcon} ${result.name}: ${countText}`);
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    
    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('📊 SUMMARY:');
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const warned = results.filter(r => r.status === 'WARN').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const errors = results.filter(r => r.status === 'ERROR').length;
  
  console.log(`✅ Working: ${passed}/${tableTests.length}`);
  console.log(`⚠️  Warnings: ${warned}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`💥 Errors: ${errors}`);
  
  const successRate = Math.round((passed / tableTests.length) * 100);
  console.log(`📈 Success Rate: ${successRate}%`);
  
  console.log('\n🔍 DETAILED RESULTS:');
  console.log('-' .repeat(50));
  
  results.forEach(r => {
    const status = r.status === 'PASS' ? '✅ WORKING' : 
                  r.status === 'WARN' ? '⚠️  WARNING' : 
                  r.status === 'FAIL' ? '❌ FAILED' : '💥 ERROR';
    
    console.log(`${r.name}: ${status}`);
    
    if (typeof r.count === 'number') {
      console.log(`  Records: ${r.count} (expected: ${r.expected}+)`);
    } else if (r.count) {
      console.log(`  Status: ${r.count}`);
    }
    
    if (r.error) {
      console.log(`  Error: ${r.error}`);
    }
    console.log('');
  });
  
  // Recommendations
  console.log('💡 RECOMMENDATIONS:');
  if (failed > 0 || errors > 0) {
    console.log('- Fix failed endpoints first');
  }
  if (warned > 0) {
    console.log('- Check endpoints with warnings');
  }
  if (successRate >= 80) {
    console.log('- System is mostly functional ✅');
  } else {
    console.log('- System needs significant fixes ⚠️');
  }
}

testAllTables().catch(console.error);