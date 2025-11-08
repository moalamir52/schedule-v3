const BASE_URL = 'https://schedule-v3-server.onrender.com';

async function fixUsers() {
  console.log('🔧 Simple fix: Adding users to production database...');
  
  // Test if we can reach the server
  try {
    const testResponse = await fetch(`${BASE_URL}/api/test-server`);
    if (testResponse.ok) {
      console.log('✅ Server is reachable');
    } else {
      console.log('❌ Server not reachable');
      return;
    }
  } catch (error) {
    console.log('❌ Cannot reach server:', error.message);
    return;
  }
  
  // Check current users
  try {
    const usersResponse = await fetch(`${BASE_URL}/api/users`);
    const users = await usersResponse.json();
    console.log(`Current users: ${users.length}`);
  } catch (error) {
    console.log('Cannot check users:', error.message);
  }
  
  // Try to login with common credentials
  const testCredentials = [
    { username: 'admin', password: 'admin123' },
    { username: 'admin', password: 'admin' },
    { username: 'Marwan', password: 'marwan123' },
    { username: 'Marwan', password: 'marwan' }
  ];
  
  console.log('\n🔐 Testing common credentials...');
  for (const cred of testCredentials) {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cred)
      });
      
      if (response.ok) {
        console.log(`✅ SUCCESS! ${cred.username}:${cred.password} works!`);
        return;
      } else {
        console.log(`❌ ${cred.username}:${cred.password} - ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${cred.username}:${cred.password} - Error: ${error.message}`);
    }
  }
  
  console.log('\n❌ No working credentials found. The users table is empty or authentication is broken.');
  console.log('💡 Solution: You need to manually add users to the PostgreSQL database on Render.');
}

fixUsers();