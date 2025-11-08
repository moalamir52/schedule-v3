const BASE_URL = 'https://schedule-v3-server.onrender.com';

async function testServer() {
  try {
    console.log('🔍 Testing server...');
    
    const response = await fetch(`${BASE_URL}/api/test-server`);
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Server is working:', result);
    } else {
      console.log('❌ Server error:', response.status);
    }
    
    // Test import endpoint
    console.log('\n🔍 Testing import endpoint...');
    const importResponse = await fetch(`${BASE_URL}/api/database/import/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: [{ id: 1, name: 'test' }] })
    });
    
    console.log('Import endpoint status:', importResponse.status);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testServer();