// Keep server alive and prevent data loss
const SERVER_URL = 'https://schedule-v3-server.onrender.com';

async function keepAlive() {
  try {
    const response = await fetch(`${SERVER_URL}/api/customers`);
    const data = await response.json();
    console.log(`✅ Server alive - ${data.length} customers found`);
  } catch (error) {
    console.log('❌ Server ping failed:', error.message);
  }
}

// Ping every 5 minutes to prevent sleep
setInterval(keepAlive, 5 * 60 * 1000);

console.log('🔄 Keep-alive service started - pinging every 5 minutes');
keepAlive(); // Initial ping