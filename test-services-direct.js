// Direct test for services API
const https = require('https');

const testServices = () => {
  const options = {
    hostname: 'schedule-v3-server.onrender.com',
    port: 443,
    path: '/api/services',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Response:', data);
    });
  });

  req.on('error', (error) => {
    console.error('Error:', error);
  });

  req.end();
};

console.log('Testing Services API...');
testServices();