const BASE_URL = 'https://schedule-v3-server.onrender.com';

async function addUsers() {
  try {
    console.log('👤 Adding users to production database...');
    
    const users = [
      { username: 'admin', password: 'admin123' },
      { username: 'Marwan', password: 'marwan123' }
    ];
    
    for (const user of users) {
      try {
        const response = await fetch(`${BASE_URL}/api/add-user`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user)
        });
        
        if (response.ok) {
          console.log(`✅ Added user: ${user.username}`);
        } else {
          const error = await response.text();
          console.log(`❌ Failed to add ${user.username}: ${response.status} - ${error}`);
        }
      } catch (error) {
        console.log(`❌ Error adding ${user.username}: ${error.message}`);
      }
    }
    
    // Test login after adding users
    console.log('\n🔐 Testing login...');
    for (const user of users) {
      try {
        const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user)
        });
        
        if (loginResponse.ok) {
          const result = await loginResponse.json();
          console.log(`✅ ${user.username}: Login successful`);
        } else {
          console.log(`❌ ${user.username}: Login failed - ${loginResponse.status}`);
        }
      } catch (error) {
        console.log(`❌ ${user.username}: Login error - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addUsers();