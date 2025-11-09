const fs = require('fs');
const path = require('path');

console.log('🔧 Assignment Controller Error Fix');
console.log('==================================');

// Read the current assignmentController
const controllerPath = path.join(__dirname, 'api', 'controllers', 'assignmentController.js');

if (!fs.existsSync(controllerPath)) {
  console.error('❌ assignmentController.js not found!');
  process.exit(1);
}

console.log('📖 Reading assignmentController.js...');
let content = fs.readFileSync(controllerPath, 'utf8');

// Add error handling wrapper for getAvailableWorkers
const getAvailableWorkersErrorFix = `
const getAvailableWorkers = async (req, res) => {
  try {
    console.log('[AVAILABLE-WORKERS] Request received:', req.query);
    
    const { day, time } = req.query;
    
    if (!day || !time) {
      console.log('[AVAILABLE-WORKERS] Missing parameters:', { day, time });
      return res.status(400).json({ 
        success: false, 
        error: 'Day and time are required',
        received: { day, time }
      });
    }
    
    console.log('[AVAILABLE-WORKERS] Fetching workers and tasks...');
    
    // Add timeout and error handling for database calls
    const [workers, existingTasks] = await Promise.all([
      Promise.race([
        db.getWorkers(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Workers query timeout')), 10000))
      ]),
      Promise.race([
        db.getScheduledTasks(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Tasks query timeout')), 10000))
      ])
    ]);
    
    console.log('[AVAILABLE-WORKERS] Database results:', {
      workersCount: workers?.length || 0,
      tasksCount: existingTasks?.length || 0
    });
    
    const activeWorkers = workers.filter(worker => worker.Status === 'Active');
    console.log('[AVAILABLE-WORKERS] Active workers:', activeWorkers.length);
    
    const busyWorkers = existingTasks
      .filter(task => task.Day === day && task.Time === time)
      .map(task => task.WorkerName);
    
    console.log('[AVAILABLE-WORKERS] Busy workers for', day, time, ':', busyWorkers);
    
    const availableWorkers = activeWorkers.filter(worker => 
      !busyWorkers.includes(worker.Name)
    );
    
    console.log('[AVAILABLE-WORKERS] Available workers:', availableWorkers.length);
    
    res.json({
      success: true,
      availableWorkers,
      busyWorkers,
      debug: {
        totalWorkers: workers.length,
        activeWorkers: activeWorkers.length,
        busyWorkers: busyWorkers.length,
        availableWorkers: availableWorkers.length
      }
    });
    
  } catch (error) {
    console.error('[AVAILABLE-WORKERS] Error:', error);
    console.error('[AVAILABLE-WORKERS] Stack:', error.stack);
    
    // Provide detailed error information
    const errorResponse = {
      success: false,
      error: error.message,
      errorType: error.constructor.name,
      timestamp: new Date().toISOString()
    };
    
    // Add specific error handling
    if (error.message.includes('timeout')) {
      errorResponse.suggestion = 'Database query timed out. Check database connection.';
    } else if (error.message.includes('connect')) {
      errorResponse.suggestion = 'Database connection failed. Check DATABASE_URL.';
    } else if (error.message.includes('relation') || error.message.includes('table')) {
      errorResponse.suggestion = 'Database table missing. Run database migration.';
    }
    
    res.status(500).json(errorResponse);
  }
};`;

const getScheduleErrorFix = `
const getSchedule = async (req, res) => {
  try {
    console.log('[GET-SCHEDULE] Request received');
    
    const now = Date.now();
    
    // Check cache first
    if (scheduleCache.data && (now - scheduleCache.timestamp) < scheduleCache.ttl) {
      console.log('[GET-SCHEDULE] Returning cached data');
      return res.json(scheduleCache.data);
    }
    
    console.log('[GET-SCHEDULE] Fetching from database...');
    
    // Add timeout for database query
    const scheduledTasks = await Promise.race([
      db.getScheduledTasks(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 15000)
      )
    ]);
    
    console.log('[GET-SCHEDULE] Retrieved', scheduledTasks.length, 'tasks');
    
    // Log database column names for debugging
    if (scheduledTasks.length > 0) {
      console.log('[GET-SCHEDULE] Sample task columns:', Object.keys(scheduledTasks[0]));
    }
    
    const assignments = scheduledTasks.map(task => {
      try {
        // Normalize task first
        const normalizedTask = normalizeTask(task);
        
        // Convert time format from "10:00" to "10:00 AM"
        let formattedTime = normalizedTask.Time?.toString().trim() || '';
        if (formattedTime && !formattedTime.includes('AM') && !formattedTime.includes('PM')) {
          const timeParts = formattedTime.split(':');
          if (timeParts.length >= 2) {
            const hour = parseInt(timeParts[0]);
            const minutes = timeParts[1];
            if (!isNaN(hour)) {
              if (hour >= 1 && hour <= 12) {
                formattedTime = \`\${hour}:\${minutes} \${hour >= 6 ? 'AM' : 'PM'}\`;
              } else if (hour === 0) {
                formattedTime = \`12:\${minutes} AM\`;
              } else if (hour > 12) {
                formattedTime = \`\${hour - 12}:\${minutes} PM\`;
              }
            }
          }
        }
        
        return {
          day: normalizedTask.Day || '',
          appointmentDate: normalizedTask.AppointmentDate || '',
          time: formattedTime,
          customerId: normalizedTask.CustomerID || '',
          customerName: normalizedTask.CustomerName || '',
          villa: normalizedTask.Villa || '',
          carPlate: normalizedTask.CarPlate || '',
          washType: (typeof normalizedTask.WashType === 'string' && normalizedTask.WashType !== '[object Promise]') ? normalizedTask.WashType : 'EXT',
          workerName: normalizedTask.WorkerName || '',
          workerId: normalizedTask.WorkerID || '',
          packageType: normalizedTask.PackageType || '',
          isLocked: normalizedTask.isLocked || 'FALSE',
          scheduleDate: normalizedTask.ScheduleDate || '',
          status: task.Status || '',
          originalWashType: task.OriginalWashType || '',
          customerStatus: task.customerStatus || 'Active'
        };
      } catch (taskError) {
        console.error('[GET-SCHEDULE] Error processing task:', taskError);
        console.error('[GET-SCHEDULE] Problematic task:', task);
        
        // Return a safe default task
        return {
          day: task.Day || '',
          appointmentDate: task.AppointmentDate || '',
          time: task.Time || '',
          customerId: task.CustomerID || '',
          customerName: task.CustomerName || 'Unknown',
          villa: task.Villa || '',
          carPlate: task.CarPlate || '',
          washType: 'EXT',
          workerName: task.WorkerName || '',
          workerId: task.WorkerID || '',
          packageType: task.PackageType || '',
          isLocked: task.isLocked || 'FALSE',
          scheduleDate: task.ScheduleDate || '',
          status: 'Active',
          originalWashType: '',
          customerStatus: 'Active'
        };
      }
    });
    
    console.log('[GET-SCHEDULE] Processed', assignments.length, 'assignments');
    
    const response = {
      success: true,
      message: assignments.length > 0 ? 'Schedule loaded successfully' : 'No schedule data found',
      totalAppointments: assignments.length,
      assignments,
      timestamp: new Date().toISOString()
    };
    
    // Update cache
    scheduleCache = {
      data: response,
      timestamp: now,
      ttl: 30000
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('[GET-SCHEDULE] Critical error:', error);
    console.error('[GET-SCHEDULE] Stack trace:', error.stack);
    
    // Clear cache on error
    scheduleCache.data = null;
    scheduleCache.timestamp = 0;
    
    const errorResponse = {
      success: false,
      error: error.message,
      errorType: error.constructor.name,
      timestamp: new Date().toISOString(),
      assignments: [] // Return empty array as fallback
    };
    
    // Add specific error handling
    if (error.message.includes('timeout')) {
      errorResponse.suggestion = 'Database query timed out. Try refreshing the page.';
    } else if (error.message.includes('connect')) {
      errorResponse.suggestion = 'Database connection failed. Check server status.';
    }
    
    res.status(500).json(errorResponse);
  }
};`;

// Check if functions need to be replaced
if (content.includes('const getAvailableWorkers = async (req, res) => {')) {
  console.log('🔧 Updating getAvailableWorkers function...');
  content = content.replace(
    /const getAvailableWorkers = async \(req, res\) => \{[\s\S]*?\n\};/,
    getAvailableWorkersErrorFix
  );
}

if (content.includes('const getSchedule = async (req, res) => {')) {
  console.log('🔧 Updating getSchedule function...');
  content = content.replace(
    /const getSchedule = async \(req, res\) => \{[\s\S]*?\n\};/,
    getScheduleErrorFix
  );
}

// Write the updated content
console.log('💾 Writing updated assignmentController.js...');
fs.writeFileSync(controllerPath, content);

console.log('✅ Assignment controller error handling updated successfully!');
console.log('🔄 Please restart your server to apply the changes.');

module.exports = { getAvailableWorkersErrorFix, getScheduleErrorFix };