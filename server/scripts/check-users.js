const BASE_URL = 'https://schedule-v3-server.onrender.com';

async function checkUsers() {
  try {
    console.log('🔍 Checking users in production database...');
    
    const response = await fetch(`${BASE_URL}/api/users`);
    const users = await response.json();
    
    console.log(`\n👥 Found ${users.length} users:`);
    users.forEach((user, i) => {
      console.log(`${i + 1}. Username: "${user.username}" | Password: "${user.password}"`);
    });
    
    // Test login with each user
    console.log('\n🔐 Testing login for each user:');
    for (const user of users) {
      try {
        const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: user.username,
            password: user.password
          })
        });
        
        if (loginResponse.ok) {
          console.log(`✅ ${user.username}: Login successful`);
        } else {
          console.log(`❌ ${user.username}: Login failed - ${loginResponse.status} ${loginResponse.statusText}`);
        }
      } catch (error) {
        console.log(`❌ ${user.username}: Login failed - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkUsers();