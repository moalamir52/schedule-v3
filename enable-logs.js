// Quick script to enable console logs
process.env.SHOW_SERVER_LOGS = 'true';
console.log('✅ Console logs enabled!');

// Test services endpoint
const express = require('express');
const app = express();

app.get('/test-services', async (req, res) => {
  try {
    const db = require('./server/services/databaseService');
    const services = await db.getServices();
    res.json({ success: true, services, count: services.length });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.listen(3001, () => {
  console.log('Test server running on port 3001');
});