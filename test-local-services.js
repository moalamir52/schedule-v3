// Test local services API
const http = require('http');

const testLocalServices = () => {
  const options = {
    hostname: 'localhost',
    port: 54112,
    path: '/api/services',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
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

console.log('Testing LOCAL Services API...');
testLocalServices();