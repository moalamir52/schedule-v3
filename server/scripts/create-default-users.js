const BASE_URL = 'https://schedule-v3-server.onrender.com';

async function createDefaultUsers() {
  try {
    console.log('👤 Creating default users in production...');
    
    // Use database endpoint to add users directly
    const users = [
      { username: 'admin', password: 'admin123' },
      { username: 'Marwan', password: 'marwan123' }
    ];
    
    for (const user of users) {
      try {
        // Use database table endpoint to insert directly
        const response = await fetch(`${BASE_URL}/api/database/table/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'insert',
            data: {
              username: user.username,
              password: user.password
            }
          })
        });
        
        if (response.ok) {
          console.log(`✅ Added user: ${user.username}`);
        } else {
          console.log(`❌ Failed to add ${user.username}: ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ Error adding ${user.username}: ${error.message}`);
      }
    }
    
    // Wait a moment then test login
    console.log('\n⏳ Waiting 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
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

createDefaultUsers();