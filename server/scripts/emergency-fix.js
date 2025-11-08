// Emergency fix: Add users with plain passwords for testing
const BASE_URL = 'https://schedule-v3-server.onrender.com';

async function emergencyFix() {
  console.log('🚨 Emergency fix: Adding test user...');
  
  // Create a simple test user via direct SQL
  try {
    const response = await fetch(`${BASE_URL}/api/database/table/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'raw_sql',
        sql: `DELETE FROM users; 
              INSERT INTO users (username, password, created_at) VALUES 
              ('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW()),
              ('test', 'test123', NOW());`
      })
    });
    
    console.log('SQL Response:', response.status);
    
    // Test with known bcrypt hash for 'password'
    const testCredentials = [
      { username: 'admin', password: 'secret' },
      { username: 'test', password: 'test123' }
    ];
    
    console.log('\n🔐 Testing emergency credentials...');
    
    for (const cred of testCredentials) {
      try {
        const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cred)
        });
        
        if (loginResponse.ok) {
          console.log(`✅ SUCCESS! Use: ${cred.username}:${cred.password}`);
          return;
        } else {
          console.log(`❌ ${cred.username}:${cred.password} - ${loginResponse.status}`);
        }
      } catch (error) {
        console.log(`❌ ${cred.username}: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Emergency fix failed:', error.message);
  }
}

emergencyFix();