require('dotenv').config();

// CRITICAL: Check environment BEFORE logger silences output
console.log('\n' + '='.repeat(50));
console.log('🔍 ENVIRONMENT CHECK (BEFORE LOGGER)');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('PORT:', process.env.PORT);
if (process.env.DATABASE_URL) {
  console.log('DATABASE_URL preview:', process.env.DATABASE_URL.substring(0, 30) + '...');
}
console.log('='.repeat(50) + '\n');

// Install centralized logger early to capture/silence existing console.* calls
const logger = require('./services/logger');
const originalConsole = {
  log: console.log.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console)
};
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

app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:3000', 
    'http://127.0.0.1:5173',
    'https://schedule-v3-bice.vercel.app',
    'https://schedule-v3.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
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

// Test login endpoint
app.post('/api/test-login', (req, res) => {
  console.log('🔐 [TEST] Login test endpoint hit!');
  console.log('Body:', req.body);
  const token = 'test-token-123';
  res.json({ success: true, token, message: 'Test login successful' });
});

// Direct login endpoint as fallback
app.post('/api/auth/login', (req, res) => {
  console.log('🔐 [DIRECT] Direct login endpoint hit!');
  console.log('Body:', req.body);
  const { username } = req.body;
  const token = `token-${username}-${Date.now()}`;
  res.json({ token, success: true, message: 'Login successful' });
});

// Test Supabase connection on Render
app.get('/api/test-supabase', async (req, res) => {
  try {
    console.log('Testing Supabase connection...');
    console.log('Environment variables:');
    console.log('USE_SUPABASE:', process.env.USE_SUPABASE);
    console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
    console.log('SUPABASE_ANON_KEY exists:', !!process.env.SUPABASE_ANON_KEY);
    
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      return res.json({
        success: false,
        error: 'Missing Supabase environment variables',
        env: {
          USE_SUPABASE: process.env.USE_SUPABASE,
          SUPABASE_URL_EXISTS: !!process.env.SUPABASE_URL,
          SUPABASE_KEY_EXISTS: !!process.env.SUPABASE_ANON_KEY
        }
      });
    }

    // Test Supabase connection
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/customers?select=count`, {
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Supabase error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    res.json({
      success: true,
      message: 'Supabase connection working',
      customerCount: data.length || 0,
      timestamp: new Date().toISOString(),
      supabaseUrl: process.env.SUPABASE_URL,
      rawData: data
    });

  } catch (error) {
    console.error('Connection test failed:', error);
    res.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
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

// Show all environment variables
app.get('/api/env-check', (req, res) => {
  res.json({
    USE_SUPABASE: process.env.USE_SUPABASE,
    SUPABASE_URL_EXISTS: !!process.env.SUPABASE_URL,
    SUPABASE_KEY_EXISTS: !!process.env.SUPABASE_ANON_KEY,
    DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    ALL_ENV_KEYS: Object.keys(process.env).filter(key => 
      key.includes('SUPABASE') || key.includes('DATABASE') || key.includes('USE_')
    )
  });
});

// Direct Supabase test
app.get('/api/direct-supabase', async (req, res) => {
  try {
    const supabase = require('./services/supabaseService');
    const customers = await supabase.getCustomers();
    res.json({
      success: true,
      count: customers.length,
      data: customers
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
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

// Direct add user endpoint
app.post('/api/add-user', async (req, res) => {
  try {
    const { username, password } = req.body;
    const db = require('./services/databaseService');
    const bcrypt = require('bcryptjs');
    
    // Check if user exists
    const existingUser = await db.findUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    
    // Hash password and add user
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.addUser({
      username,
      password: hashedPassword,
      plainPassword: password,
      role: 'User',
      Status: 'Active'
    });
    
    res.json({ success: true, message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Database viewer endpoint
app.get('/api/database/tables', async (req, res) => {
  try {
    const { Client } = require('pg');
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    await client.connect();
    
    const result = await client.query(`
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const tables = [];
    for (const table of result.rows) {
      const countResult = await client.query(`SELECT COUNT(*) FROM ${table.table_name}`);
      tables.push({
        name: table.table_name,
        columns: table.column_count,
        rows: parseInt(countResult.rows[0].count)
      });
    }
    
    await client.end();
    res.json({ success: true, tables });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Database table data endpoint
app.get('/api/database/table/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    const limit = req.query.limit || 50;
    
    const { Client } = require('pg');
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    await client.connect();
    
    const result = await client.query(`SELECT * FROM ${tableName} LIMIT $1`, [limit]);
    
    await client.end();
    res.json({ success: true, data: result.rows, count: result.rows.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Database import endpoint
app.post('/api/database/import/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    const { data } = req.body;
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.json({ success: true, message: 'No data to import' });
    }
    
    const { Client } = require('pg');
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    await client.connect();
    
    // Create table structure based on first record
    const firstRecord = data[0];
    const columns = Object.keys(firstRecord);
    
    // Create table if not exists
    const createTableSQL = `CREATE TABLE IF NOT EXISTS "${tableName}" (${columns.map(col => `"${col}" TEXT`).join(', ')})`;
    await client.query(createTableSQL);
    
    // Clear existing data only if not appending
    const { append } = req.body;
    if (!append) {
      await client.query(`DELETE FROM "${tableName}"`);
    }
    
    // Insert new data
    for (const record of data) {
      const values = columns.map(col => record[col] || null);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      const insertSQL = `INSERT INTO "${tableName}" (${columns.map(col => `"${col}"`).join(', ')}) VALUES (${placeholders})`;
      await client.query(insertSQL, values);
    }
    
    await client.end();
    
    console.log(`✅ Imported ${data.length} records to ${tableName}`);
    res.json({ success: true, message: `Imported ${data.length} records to ${tableName}` });
    
  } catch (error) {
    console.error(`❌ Import error for ${req.params.tableName}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Clear all PostgreSQL tables endpoint
app.post('/api/database/clear-all', async (req, res) => {
  try {
    const { Client } = require('pg');
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    await client.connect();
    
    // Get all table names
    const result = await client.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
    `);
    
    // Drop all tables
    for (const row of result.rows) {
      await client.query(`DROP TABLE IF EXISTS "${row.tablename}" CASCADE`);
      console.log(`❌ Dropped table: ${row.tablename}`);
    }
    
    await client.end();
    
    console.log('✅ All PostgreSQL tables cleared');
    res.json({ success: true, message: 'All PostgreSQL tables cleared' });
    
  } catch (error) {
    console.error('❌ Clear all error:', error);
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

app.listen(PORT, async () => {
  // Force console output
  originalConsole.log('\n' + '='.repeat(80));
  originalConsole.log('🚀 SCHEDULE V3 SERVER STARTED SUCCESSFULLY!');
  originalConsole.log('='.repeat(80));
  originalConsole.log(`✅ Schedule v3 Server running on port ${PORT}`);
  originalConsole.log(`🌐 Server URL: http://localhost:${PORT}`);
  originalConsole.log(`📊 Version: 2.1.0`);
  originalConsole.log(`⏰ Started at: ${new Date().toISOString()}`);
  originalConsole.log(`🔧 SHOW_SERVER_LOGS: ${process.env.SHOW_SERVER_LOGS}`);
  originalConsole.log(`🔧 Available endpoints:`);
  originalConsole.log(`   - PUT /api/schedule/assign/batch-update`);
  originalConsole.log(`   - GET /api/schedule/assign/current`);
  originalConsole.log('='.repeat(80) + '\n');
  
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
  
  // Initialize database service to check environment
  try {
    console.log('🔍 Initializing database service...');
    
    // Setup PostgreSQL if DATABASE_URL exists
    if (process.env.DATABASE_URL) {
      const { setupPostgreSQL } = require('./scripts/setup-postgres');
      try {
        await setupPostgreSQL();
      } catch (error) {
        console.log('❌ PostgreSQL setup failed:', error.message);
      }
    }
    
    const db = require('./services/databaseService');
    console.log('✅ Database service initialized');
  } catch (error) {
    console.log('❌ Database service failed:', error.message);
  }
  
  // Start cron service
  try {
    const cronService = require('./services/cronService');
    cronService.start();
    console.log('✅ Cron service started');
  } catch (error) {
    console.log('⚠️ Cron service failed to start:', error.message);
  }
});