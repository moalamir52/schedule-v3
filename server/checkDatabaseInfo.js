// Check database connection info
const databaseService = require('./services/databaseService');

console.log('🔍 Database Connection Info:');
console.log('DATABASE_URL:', process.env.DATABASE_URL || 'Not set');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');

// Add endpoint to server.js to check database info
// GET /api/database-info