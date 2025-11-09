// Test database service directly
try {
  console.log('Loading database service...');
  const db = require('./server/services/databaseService');
  console.log('Database service loaded:', typeof db);
  console.log('Available methods:', Object.getOwnPropertyNames(db));
  
  // Test getServices
  db.getServices().then(services => {
    console.log('Services:', services);
  }).catch(error => {
    console.error('Error:', error.message);
  });
} catch (error) {
  console.error('Failed to load database service:', error.message);
}