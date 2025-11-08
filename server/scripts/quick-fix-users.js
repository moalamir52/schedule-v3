// Quick fix: Add users directly to production PostgreSQL
require('dotenv').config();

async function quickFixUsers() {
  console.log('🚀 Quick fix: Adding users to production...');
  
  const BASE_URL = 'https://schedule-v3-server.onrender.com';
  
  // Add direct SQL insert endpoint to server
  try {
    const response = await fetch(`${BASE_URL}/api/database/table/users`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sql: `INSERT INTO users (username, password) VALUES 
              ('admin', 'admin123'),
              ('Marwan', 'marwan123')
              ON CONFLICT (username) DO NOTHING`
      })
    });
    
    if (response.ok) {
      console.log('✅ Users added successfully');
    } else {
      console.log('❌ Failed to add users');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  // Test login
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const testLogin = async (username, password) => {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (response.ok) {
        console.log(`✅ ${username}: تسجيل دخول ناجح!`);
        return true;
      } else {
        console.log(`❌ ${username}: فشل تسجيل الدخول - ${response.status}`);
        return false;
      }
    } catch (error) {
      console.log(`❌ ${username}: خطأ - ${error.message}`);
      return false;
    }
  };
  
  console.log('\n🔐 اختبار تسجيل الدخول...');
  await testLogin('admin', 'admin123');
  await testLogin('Marwan', 'marwan123');
}

quickFixUsers();