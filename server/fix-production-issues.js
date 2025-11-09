#!/usr/bin/env node

/**
 * Production Server Issues Fix Script
 * ==================================
 * 
 * This script fixes common issues with the production server:
 * 1. Database connection problems
 * 2. Missing environment variables
 * 3. API endpoint errors
 * 4. Missing database tables
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Production Server Issues Fix Script');
console.log('======================================');
console.log('Time:', new Date().toISOString());
console.log('');

// Step 1: Environment Check
console.log('📋 Step 1: Environment Check');
console.log('----------------------------');

const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER;
const hasDatabase = !!process.env.DATABASE_URL;

console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Is Production:', isProduction);
console.log('Has DATABASE_URL:', hasDatabase);
console.log('Port:', process.env.PORT || '3001');

if (isProduction && !hasDatabase) {
  console.error('❌ CRITICAL: Production environment without DATABASE_URL!');
  console.log('');
  console.log('🔧 SOLUTION:');
  console.log('1. Go to your Render dashboard');
  console.log('2. Navigate to your service settings');
  console.log('3. Add Environment Variable: DATABASE_URL');
  console.log('4. Set it to your PostgreSQL connection string');
  console.log('5. Redeploy the service');
  console.log('');
  process.exit(1);
}

// Step 2: Database Connection Test
console.log('');
console.log('🐘 Step 2: Database Connection Test');
console.log('-----------------------------------');

async function testDatabaseConnection() {
  try {
    const db = require('./services/databaseService');
    
    console.log('Database type:', db.isPostgres ? 'PostgreSQL' : 'SQLite');
    
    if (db.isPostgres) {
      console.log('Testing PostgreSQL connection...');
      
      // Test basic connection
      const customers = await Promise.race([
        db.getCustomers(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 10000)
        )
      ]);
      
      console.log('✅ PostgreSQL connection successful');
      console.log('✅ Customers table accessible:', customers.length, 'records');
      
      // Test other tables
      const workers = await db.getWorkers();
      console.log('✅ Workers table accessible:', workers.length, 'records');
      
      const tasks = await db.getScheduledTasks();
      console.log('✅ ScheduledTasks table accessible:', tasks.length, 'records');
      
    } else {
      console.log('Testing SQLite connection...');
      const customers = await db.getCustomers();
      console.log('✅ SQLite connection successful:', customers.length, 'customers');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    if (error.message.includes('timeout')) {
      console.log('💡 Issue: Database query timeout');
      console.log('🔧 Solution: Check database server performance');
    } else if (error.message.includes('connect ECONNREFUSED')) {
      console.log('💡 Issue: Connection refused');
      console.log('🔧 Solution: Check if database server is running');
    } else if (error.message.includes('authentication failed')) {
      console.log('💡 Issue: Authentication failed');
      console.log('🔧 Solution: Check DATABASE_URL credentials');
    } else if (error.message.includes('does not exist')) {
      console.log('💡 Issue: Database or table does not exist');
      console.log('🔧 Solution: Run database migration script');
    }
    
    return false;
  }
}

// Step 3: API Endpoints Test
console.log('');
console.log('🌐 Step 3: API Endpoints Test');
console.log('------------------------------');

async function testAPIEndpoints() {
  try {
    // Test the problematic endpoints
    const assignmentController = require('./api/controllers/assignmentController');
    
    console.log('✅ Assignment controller loaded successfully');
    
    // Check if functions exist
    const functions = ['getAvailableWorkers', 'getSchedule', 'autoAssignSchedule'];
    functions.forEach(func => {
      if (typeof assignmentController[func] === 'function') {
        console.log('✅', func, 'function exists');
      } else {
        console.log('❌', func, 'function missing');
      }
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ API endpoints test failed:', error.message);
    return false;
  }
}

// Step 4: Fix Missing Functions
async function fixMissingFunctions() {
  console.log('');
  console.log('🔧 Step 4: Fix Missing Functions');
  console.log('--------------------------------');
  
  try {
    // Check if logicService.js is complete
    const logicServicePath = path.join(__dirname, 'services', 'logicService.js');
    const logicContent = fs.readFileSync(logicServicePath, 'utf8');
    
    if (!logicContent.includes('module.exports')) {
      console.log('❌ logicService.js incomplete - fixing...');
      
      // Add missing exports
      const missingExports = `
module.exports = {
  buildWeeklySchedule,
  calculateWashSchedule,
  parsePackage,
  generateWashDays,
  determineWashType,
  checkIfFirstWeekOfBiWeekCycle,
  determineIntCarForCustomer
};`;
      
      fs.appendFileSync(logicServicePath, missingExports);
      console.log('✅ logicService.js exports fixed');
    } else {
      console.log('✅ logicService.js is complete');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Fix missing functions failed:', error.message);
    return false;
  }
}

// Step 5: Create Health Check Endpoint
async function createHealthCheck() {
  console.log('');
  console.log('🏥 Step 5: Create Health Check Endpoint');
  console.log('---------------------------------------');
  
  try {
    const healthCheckPath = path.join(__dirname, 'api', 'routes', 'healthRoutes.js');
    
    if (!fs.existsSync(healthCheckPath)) {
      const healthCheckContent = `
const express = require('express');
const router = express.Router();

// Health check endpoint
router.get('/', async (req, res) => {
  try {
    const db = require('../../services/databaseService');
    
    // Test database connection
    const customers = await Promise.race([
      db.getCustomers(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database timeout')), 5000)
      )
    ]);
    
    const workers = await db.getWorkers();
    const tasks = await db.getScheduledTasks();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        type: db.isPostgres ? 'PostgreSQL' : 'SQLite',
        connected: true,
        customers: customers.length,
        workers: workers.length,
        tasks: tasks.length
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT,
        hasDatabase: !!process.env.DATABASE_URL
      }
    });
    
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      database: {
        connected: false
      }
    });
  }
});

// Database status endpoint
router.get('/database', async (req, res) => {
  try {
    const db = require('../../services/databaseService');
    
    const [customers, workers, tasks] = await Promise.all([
      db.getCustomers(),
      db.getWorkers(), 
      db.getScheduledTasks()
    ]);
    
    res.json({
      success: true,
      database: {
        type: db.isPostgres ? 'PostgreSQL' : 'SQLite',
        tables: {
          customers: customers.length,
          workers: workers.length,
          scheduledTasks: tasks.length
        }
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
`;
      
      fs.writeFileSync(healthCheckPath, healthCheckContent);
      console.log('✅ Health check endpoint created');
      
      // Add to main server file
      const serverPath = path.join(__dirname, 'server.js');
      if (fs.existsSync(serverPath)) {
        let serverContent = fs.readFileSync(serverPath, 'utf8');
        
        if (!serverContent.includes('/api/health')) {
          const healthRoute = "app.use('/api/health', require('./api/routes/healthRoutes'));";
          
          // Find a good place to insert the route
          if (serverContent.includes("app.use('/api/")) {
            serverContent = serverContent.replace(
              /(app\.use\('\/api\/[^']+',.*?\);)/,
              '$1\n' + healthRoute
            );
          } else {
            // Add before app.listen
            serverContent = serverContent.replace(
              /(app\.listen|const port)/,
              healthRoute + '\n\n$1'
            );
          }
          
          fs.writeFileSync(serverPath, serverContent);
          console.log('✅ Health check route added to server.js');
        }
      }
    } else {
      console.log('✅ Health check endpoint already exists');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Create health check failed:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting production fixes...');
  console.log('');
  
  const results = {
    database: await testDatabaseConnection(),
    api: await testAPIEndpoints(),
    functions: await fixMissingFunctions(),
    healthCheck: await createHealthCheck()
  };
  
  console.log('');
  console.log('📊 Fix Results Summary');
  console.log('=====================');
  console.log('Database Connection:', results.database ? '✅ PASS' : '❌ FAIL');
  console.log('API Endpoints:', results.api ? '✅ PASS' : '❌ FAIL');
  console.log('Missing Functions:', results.functions ? '✅ FIXED' : '❌ FAIL');
  console.log('Health Check:', results.healthCheck ? '✅ CREATED' : '❌ FAIL');
  
  const allPassed = Object.values(results).every(result => result === true);
  
  console.log('');
  if (allPassed) {
    console.log('🎉 All fixes completed successfully!');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('1. Restart your server');
    console.log('2. Test the endpoints:');
    console.log('   - GET /api/health (health check)');
    console.log('   - GET /api/schedule/assign/current');
    console.log('   - GET /api/schedule/assign/available-workers?day=Saturday&time=9:00%20AM');
    console.log('3. Check server logs for any remaining issues');
  } else {
    console.log('⚠️  Some fixes failed. Please check the errors above.');
    console.log('');
    console.log('🆘 If problems persist:');
    console.log('1. Check Render service logs');
    console.log('2. Verify DATABASE_URL is set correctly');
    console.log('3. Ensure all environment variables are configured');
    console.log('4. Try redeploying the service');
  }
  
  console.log('');
  console.log('🔗 Useful URLs:');
  console.log('- Health Check: https://your-app.onrender.com/api/health');
  console.log('- Database Status: https://your-app.onrender.com/api/health/database');
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}

module.exports = { main, testDatabaseConnection, testAPIEndpoints };