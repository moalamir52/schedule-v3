const BASE_URL = 'https://schedule-v3-server.onrender.com';

async function debugUsers() {
  console.log('🔍 Debugging users in production...');
  
  try {
    // Get all users
    const response = await fetch(`${BASE_URL}/api/users`);
    const users = await response.json();
    
    console.log(`\n👥 Found ${users.length} users:`);
    users.forEach((user, i) => {
      console.log(`${i + 1}. ID: ${user.id || user.UserID}`);
      console.log(`   Username: "${user.username || user.Username}"`);
      console.log(`   Password: "${user.password || user.Password}"`);
      console.log(`   Status: "${user.status || user.Status}"`);
      console.log(`   Role: "${user.role || user.Role}"`);
      console.log('');
    });
    
    // Test login with exact data from database
    console.log('🔐 Testing login with database data...');
    for (const user of users) {
      const username = user.username || user.Username;
      
      // Try with plain passwords first
      const testPasswords = ['admin123', 'marwan123', 'admin', 'marwan'];
      
      for (const password of testPasswords) {
        try {
          const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
          });
          
          if (loginResponse.ok) {
            console.log(`✅ SUCCESS! ${username}:${password} works!`);
            return;
          }
        } catch (e) {
          // Continue
        }
      }
      
      console.log(`❌ ${username}: No working password found`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugUsers();