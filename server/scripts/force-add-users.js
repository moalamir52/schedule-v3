// Force add users using complete-export method
const sqlite3 = require('sqlite3').verbose();

async function forceAddUsers() {
  console.log('🔧 Force adding users to production...');
  
  const BASE_URL = 'https://schedule-v3-server.onrender.com';
  
  // Create users data
  const users = [
    { username: 'admin', password: 'admin123' },
    { username: 'Marwan', password: 'marwan123' }
  ];
  
  // Use the same method as complete-export.js
  for (const user of users) {
    try {
      const response = await fetch(`${BASE_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });
      
      const result = await response.text();
      console.log(`User ${user.username}: ${response.status} - ${result}`);
    } catch (error) {
      console.log(`❌ ${user.username}: ${error.message}`);
    }
  }
  
  // Wait and test
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('\n🔐 Testing login...');
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
}

forceAddUsers();