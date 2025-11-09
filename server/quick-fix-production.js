// Quick fix for production database issues
const fs = require('fs');
const path = require('path');

console.log('🚀 Quick Production Database Fix');
console.log('===============================');

// 1. Fix the truncated logicService.js
const logicServicePath = path.join(__dirname, 'services', 'logicService.js');
let logicContent = fs.readFileSync(logicServicePath, 'utf8');

// Complete the truncated function
if (logicContent.includes('const weeksSinceLastWash = Math.flo')) {
  console.log('🔧 Fixing truncated logicService.js...');
  
  const fixedEnding = `or(daysDiff / 7);
  
  // Determine if this is the first week of the bi-weekly cycle
  const isFirstWeek = (weeksSinceLastWash % 2) === 0;
  
  console.log(\`[BI-WEEK] Weeks since last wash: \${weeksSinceLastWash}, Is first week: \${isFirstWeek}\`);
  
  return isFirstWeek;
}

function determineIntCarForCustomer(allCarPlates, allHistory, visitIndex, weekOffset = 0) {
  if (allCarPlates.length <= 1) {
    return allCarPlates[0] || null;
  }
  
  // For multi-car customers, alternate INT between cars
  const sortedPlates = [...allCarPlates].sort();
  const intCarIndex = visitIndex % sortedPlates.length;
  
  return sortedPlates[intCarIndex];
}

module.exports = {
  buildWeeklySchedule,
  calculateWashSchedule,
  parsePackage,
  generateWashDays,
  determineWashType,
  checkIfFirstWeekOfBiWeekCycle,
  determineIntCarForCustomer
};`;

  logicContent = logicContent.replace(/const weeksSinceLastWash = Math\.flo$/, fixedEnding);
  fs.writeFileSync(logicServicePath, logicContent);
  console.log('✅ logicService.js fixed');
}

// 2. Add error handling to assignmentController endpoints
const controllerPath = path.join(__dirname, 'api', 'controllers', 'assignmentController.js');
let controllerContent = fs.readFileSync(controllerPath, 'utf8');

// Add better error handling for getAvailableWorkers
const errorHandlingPatch = `
// Add this at the beginning of getAvailableWorkers function
const getAvailableWorkers = async (req, res) => {
  try {
    console.log('[AVAILABLE-WORKERS] Request:', req.query);
    
    const { day, time } = req.query;
    
    if (!day || !time) {
      return res.status(400).json({ 
        success: false, 
        error: 'Day and time are required' 
      });
    }
    
    // Add timeout protection
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database timeout')), 10000)
    );
    
    const [workers, existingTasks] = await Promise.race([
      Promise.all([db.getWorkers(), db.getScheduledTasks()]),
      timeout
    ]);
    
    const activeWorkers = workers.filter(worker => worker.Status === 'Active');
    const busyWorkers = existingTasks
      .filter(task => task.Day === day && task.Time === time)
      .map(task => task.WorkerName);
    
    const availableWorkers = activeWorkers.filter(worker => 
      !busyWorkers.includes(worker.Name)
    );
    
    res.json({
      success: true,
      availableWorkers,
      busyWorkers
    });
    
  } catch (error) {
    console.error('[AVAILABLE-WORKERS] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      suggestion: 'Check database connection and try again'
    });
  }
};`;

// Only patch if not already patched
if (!controllerContent.includes('Database timeout')) {
  console.log('🔧 Adding error handling to assignmentController...');
  
  // Find and replace the getAvailableWorkers function
  const functionRegex = /const getAvailableWorkers = async \(req, res\) => \{[\s\S]*?\n\};/;
  if (functionRegex.test(controllerContent)) {
    controllerContent = controllerContent.replace(functionRegex, errorHandlingPatch);
    fs.writeFileSync(controllerPath, controllerContent);
    console.log('✅ assignmentController.js patched');
  }
}

// 3. Create environment check script for production
const envCheckScript = `
// Environment check for production deployment
console.log('🔍 Production Environment Check');
console.log('=============================');

console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('PORT:', process.env.PORT || 'Not set');

if (process.env.DATABASE_URL) {
  console.log('✅ DATABASE_URL is configured');
  console.log('URL preview:', process.env.DATABASE_URL.substring(0, 30) + '...');
} else {
  console.log('❌ DATABASE_URL is missing!');
  console.log('Please add it in Render Environment Variables');
}

// Test basic database connection
const db = require('./services/databaseService');

async function testConnection() {
  try {
    if (db.isPostgres) {
      console.log('🐘 Using PostgreSQL');
      const customers = await db.getCustomers();
      console.log(\`✅ Connection successful! Found \${customers.length} customers\`);
    } else {
      console.log('📁 Using SQLite');
      const customers = await db.getCustomers();
      console.log(\`✅ Connection successful! Found \${customers.length} customers\`);
    }
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

testConnection();
`;

fs.writeFileSync(path.join(__dirname, 'check-production-env.js'), envCheckScript);

console.log('🎉 Quick production fix completed!');
console.log('');
console.log('📋 Next steps for production deployment:');
console.log('1. Set DATABASE_URL in Render Environment Variables');
console.log('2. Deploy the updated code');
console.log('3. Run: node check-production-env.js');
console.log('4. Test the endpoints');

module.exports = { success: true };