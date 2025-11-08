const BASE_URL = 'https://schedule-v3-server.onrender.com';

async function testLoginDirect() {
  console.log('🔐 Testing login directly...');
  
  const credentials = [
    { username: 'admin', password: 'admin123' },
    { username: 'Marwan', password: 'marwan123' }
  ];
  
  for (const cred of credentials) {
    try {
      console.log(`\nTesting ${cred.username}:${cred.password}...`);
      
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(cred)
      });
      
      const responseText = await response.text();
      console.log(`Status: ${response.status}`);
      console.log(`Response: ${responseText}`);
      
      if (response.ok) {
        console.log(`✅ SUCCESS! ${cred.username} logged in!`);
        return;
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n❌ All login attempts failed');
}

testLoginDirect();