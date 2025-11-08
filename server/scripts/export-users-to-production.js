const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const BASE_URL = 'https://schedule-v3-server.onrender.com';
const dbPath = './database/database.db';

async function exportUsers() {
  try {
    console.log('📤 Exporting users from local SQLite to production...');
    
    // Read users from local SQLite
    const db = new sqlite3.Database(dbPath);
    
    const users = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM Users', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
    
    console.log(`Found ${users.length} users in local database:`);
    users.forEach((user, i) => {
      console.log(`${i + 1}. Username: "${user.Username}" | Password: "${user.PlainPassword || user.Password}"`);
    });
    
    db.close();
    
    // If no users in local, create default ones
    if (users.length === 0) {
      console.log('No users found locally. Creating default users...');
      const defaultUsers = [
        { Username: 'admin', PlainPassword: 'admin123' },
        { Username: 'Marwan', PlainPassword: 'marwan123' }
      ];
      
      for (const user of defaultUsers) {
        await addUserToProduction(user.Username, user.PlainPassword);
      }
    } else {
      // Export existing users
      for (const user of users) {
        const password = user.PlainPassword || user.Password;
        await addUserToProduction(user.Username, password);
      }
    }
    
    // Test login
    console.log('\n🔐 Testing login...');
    const testUsers = users.length > 0 ? users : [
      { Username: 'admin', PlainPassword: 'admin123' },
      { Username: 'Marwan', PlainPassword: 'marwan123' }
    ];
    
    for (const user of testUsers) {
      const password = user.PlainPassword || user.Password;
      await testLogin(user.Username, password);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function addUserToProduction(username, password) {
  try {
    // Try multiple endpoints
    const endpoints = ['/api/add-user', '/api/users'];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        
        if (response.ok) {
          console.log(`✅ Added user: ${username} via ${endpoint}`);
          return;
        } else if (response.status === 400) {
          const error = await response.json();
          if (error.message && error.message.includes('already exists')) {
            console.log(`ℹ️ User ${username} already exists`);
            return;
          }
        }
      } catch (e) {
        // Continue to next endpoint
      }
    }
    
    console.log(`❌ Failed to add user: ${username}`);
  } catch (error) {
    console.log(`❌ Error adding ${username}: ${error.message}`);
  }
}

async function testLogin(username, password) {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    if (response.ok) {
      console.log(`✅ ${username}: Login successful`);
    } else {
      console.log(`❌ ${username}: Login failed - ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ ${username}: Login error - ${error.message}`);
  }
}

exportUsers();