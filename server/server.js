require('dotenv').config();
// Install centralized logger early to capture/silence existing console.* calls
const logger = require('./services/logger');
logger.install();
const express = require('express');
const cors = require('cors');

const scheduleRoutes = require('./api/routes/scheduleRoutes');
const clientRoutes = require('./api/routes/clientRoutes');
const authRoutes = require('./api/routes/authRoutes');
const assignmentRoutes = require('./api/routes/assignmentRoutes');
const overviewRoutes = require('./api/routes/overviewRoutes');
const workerRoutes = require('./api/routes/workerRoutes');
const tasksRoutes = require('./api/routes/tasksRoutes');
const invoiceRoutes = require('./api/routes/invoiceRoutes');
const clientsRoutes = require('./api/routes/clientsRoutes');
const workersRoutes = require('./api/routes/workersRoutes');
const servicesRoutes = require('./api/routes/servicesRoutes');
const userRoutes = require('./api/routes/userRoutes');
const auditRoutes = require('./api/routes/auditRoutes');
const aiRoutes = require('./api/routes/aiRoutes');
const debugRoutes = require('./api/routes/debugRoutes');
const autoScheduleRoutes = require('./api/routes/autoScheduleRoutes');
const washRulesRoutes = require('./api/routes/washRulesRoutes');
const completedTasksRoutes = require('./api/routes/completedTasksRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.text());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`\n🌐 [${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.url.includes('batch-update')) {
    console.log('🚨🚨🚨 [BATCH-UPDATE-REQUEST] FOUND BATCH-UPDATE REQUEST!');
    console.log('📦 Headers:', req.headers);
    console.log('📦 Body:', JSON.stringify(req.body, null, 2));
  }
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
  }
  next();
});
app.use((req, res, next) => {
  if (req.headers['content-type'] === 'text/plain' && req.body) {
    try {
      req.body = JSON.parse(req.body);
    } catch (e) {
      // Silent fail
    }
  }
  next();
});

// Add simple test endpoint
app.get('/api/test-server', (req, res) => {
  console.log('🚀 [TEST] Server test endpoint hit!');
  res.json({ success: true, message: 'Server is working!', timestamp: new Date().toISOString() });
});

// Add test route before assignment routes
app.put('/api/schedule/assign/batch-update', (req, res) => {
  console.log('\n' + '='.repeat(80));
  console.log('🚨 [DIRECT-ROUTE] BATCH-UPDATE PUT HIT DIRECTLY!');
  console.log('🚨 [DIRECT-ROUTE] Method:', req.method);
  console.log('🚨 [DIRECT-ROUTE] Body:', JSON.stringify(req.body, null, 2));
  console.log('='.repeat(80) + '\n');
  
  // Call the actual function
  const { batchUpdateTasks } = require('./api/controllers/assignmentController');
  batchUpdateTasks(req, res);
});

// Add GET test for batch-update
app.get('/api/schedule/assign/batch-update', (req, res) => {
  console.log('🚀 [TEST] Batch-update GET endpoint hit!');
  res.json({ success: true, message: 'Batch-update endpoint is reachable!', method: 'GET' });
});

app.use('/api/schedule/assign', assignmentRoutes);
app.use('/api/schedule/overview', overviewRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/worker', workerRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/workers', workersRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', clientRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/auto-schedule', autoScheduleRoutes);
app.use('/api/wash-rules', washRulesRoutes);
app.use('/api/completed-tasks', completedTasksRoutes);
app.use('/api/cron', require('./api/routes/cronRoutes'));

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Schedule v3 Server is running',
    version: '2.1.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/version',
      schedule: '/api/schedule/assign',
      washHistory: '/api/schedule/assign/wash-history/:customerId'
    }
  });
});

// Direct wash history route as fallback
app.get('/api/wash-history/:customerId', async (req, res) => {
  try {
    const { getWashHistory } = require('./api/controllers/assignmentController');
    await getWashHistory(req, res);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Direct clear all route as fallback
app.delete('/api/clear-all-schedule', async (req, res) => {
  try {
    const { clearAllScheduleData } = require('./api/controllers/assignmentController');
    await clearAllScheduleData(req, res);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/clear-all-schedule', async (req, res) => {
  try {
    const { clearAllScheduleData } = require('./api/controllers/assignmentController');
    await clearAllScheduleData(req, res);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Version check endpoint
app.get('/api/version', (req, res) => {
  res.json({
    success: true,
    version: '2.1.0',
    features: {
      simplifiedWorkerAssignment: true,
      washHistoryFallback: true,
      improvedErrorHandling: true
    },
    timestamp: new Date().toISOString()
  });
});

// Database info endpoint
app.get('/api/database-info', (req, res) => {
  const dbInfo = {
    hasPostgresUrl: !!process.env.DATABASE_URL,
    hasPostgresUrl2: !!process.env.POSTGRES_URL,
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    dbType: process.env.DATABASE_URL ? 
      (process.env.DATABASE_URL.includes('postgres') ? 'PostgreSQL' : 'Other') : 
      'SQLite (Local)',
    timestamp: new Date().toISOString()
  };
  
  res.json(dbInfo);
});

// Direct clients next-id endpoint
app.get('/api/clients/next-id', async (req, res) => {
  try {
    const db = require('./services/databaseService');
    const customers = await db.getCustomers();
    
    let maxNum = 0;
    customers.forEach(customer => {
      const match = customer.CustomerID?.match(/CUST-(\d+)/);
      if (match) {
        const num = parseInt(match[1]);
        if (num > maxNum) maxNum = num;
      }
    });
    
    const nextId = `CUST-${String(maxNum + 1).padStart(3, '0')}`;
    res.json({ success: true, nextId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('🔴 Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🔴 Unhandled Rejection at:', promise, 'reason:', reason);
});

app.listen(PORT, () => {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 SCHEDULE V3 SERVER STARTED SUCCESSFULLY!');
  console.log('='.repeat(80));
  console.log(`✅ Schedule v3 Server running on port ${PORT}`);
  console.log(`🌐 Server URL: http://localhost:${PORT}`);
  console.log(`📊 Version: 2.1.0`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  console.log(`🔧 Available endpoints:`);
  console.log(`   - PUT /api/schedule/assign/batch-update`);
  console.log(`   - GET /api/schedule/assign/current`);
  console.log('='.repeat(80) + '\n');
  
  // Start cron service
  try {
    const cronService = require('./services/cronService');
    cronService.start();
    console.log('✅ Cron service started');
  } catch (error) {
    console.log('⚠️ Cron service failed to start:', error.message);
  }
});