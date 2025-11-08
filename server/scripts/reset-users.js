const BASE_URL = 'https://schedule-v3-server.onrender.com';

async function resetUsers() {
  console.log('🔄 Resetting users with proper password hashing...');
  
  // Clear existing users first
  try {
    const users = await fetch(`${BASE_URL}/api/users`).then(r => r.json());
    console.log(`Found ${users.length} existing users`);
  } catch (e) {
    console.log('Cannot check existing users');
  }
  
  // Add users with proper hashing
  const newUsers = [
    { username: 'admin', password: 'admin123' },
    { username: 'Marwan', password: 'marwan123' }
  ];
  
  for (const user of newUsers) {
    try {
      const response = await fetch(`${BASE_URL}/api/add-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });
      
      const result = await response.json();
      if (response.ok) {
        console.log(`✅ ${user.username}: Added successfully`);
      } else {
        console.log(`⚠️ ${user.username}: ${result.message}`);
      }
    } catch (error) {
      console.log(`❌ ${user.username}: ${error.message}`);
    }
  }
  
  // Test login
  console.log('\n🔐 Testing login...');
  await new Promise(r => setTimeout(r, 1000));
  
  for (const user of newUsers) {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ ${user.username}: تسجيل دخول ناجح!`);
      } else {
        console.log(`❌ ${user.username}: فشل - ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${user.username}: خطأ - ${error.message}`);
    }
  }
}

resetUsers();