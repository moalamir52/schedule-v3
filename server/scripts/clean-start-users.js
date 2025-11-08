const BASE_URL = 'https://schedule-v3-server.onrender.com';

async function cleanStartUsers() {
  console.log('🧹 Clean start: Recreating users table...');
  
  try {
    // Clear users table via SQL
    const clearResponse = await fetch(`${BASE_URL}/api/database/table/users`, {
      method: 'DELETE'
    });
    
    console.log('Clear response:', clearResponse.status);
    
    // Wait a moment
    await new Promise(r => setTimeout(r, 2000));
    
    // Add users with simple method
    const users = [
      { username: 'admin', password: 'admin123' },
      { username: 'Marwan', password: 'marwan123' }
    ];
    
    for (const user of users) {
      try {
        // Use register endpoint instead
        const response = await fetch(`${BASE_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: user.username,
            password: user.password,
            role: 'Admin'
          })
        });
        
        const result = await response.text();
        console.log(`Register ${user.username}: ${response.status} - ${result}`);
      } catch (error) {
        console.log(`❌ ${user.username}: ${error.message}`);
      }
    }
    
    // Test login
    console.log('\n🔐 Testing login...');
    await new Promise(r => setTimeout(r, 2000));
    
    for (const user of users) {
      try {
        const response = await fetch(`${BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user)
        });
        
        if (response.ok) {
          console.log(`✅ ${user.username}: SUCCESS!`);
        } else {
          console.log(`❌ ${user.username}: ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ ${user.username}: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

cleanStartUsers();