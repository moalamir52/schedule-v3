const { getCustomers, getAllHistory, getWorkers, clearAndWriteSheet, getScheduledTasks, getSheetData } = require('../../services/googleSheetsService');
const { determineIntCarForCustomer, checkIfFirstWeekOfBiWeekCycle } = require('../../services/logicService');
const logger = require('../../services/logger');

// Rate limiting for Google Sheets API
let lastApiCall = 0;
const API_DELAY = 2000; // 2 seconds between calls

const rateLimitedApiCall = async (apiFunction) => {
  const now = Date.now();
  const timeSinceLastCall = now - lastApiCall;
  
  if (timeSinceLastCall < API_DELAY) {
    const waitTime = API_DELAY - timeSinceLastCall;
    console.log(`[RATE-LIMIT] Waiting ${waitTime}ms before API call`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastApiCall = Date.now();
  return await apiFunction();
};

// Get wash rules from Google Sheets
const getWashRules = async () => {
  try {
    const washRulesData = await getSheetData('WashRules');
    const activeRules = washRulesData.filter(rule => rule.Status === 'Active');
    if (!activeRules || activeRules.length === 0) {
      // Return default rules if sheet doesn't exist
      return [
        {
          name: '2 Ext 1 INT week',
          singleCar: ['EXT', 'EXT', 'INT'],
          multiCar: {
            visit1: { car1: 'EXT', car2: 'EXT' },
            visit2: { car1: 'EXT', car2: 'EXT' },
            visit3: { car1: 'INT', car2: 'EXT' }
          },
          biWeekly: { enabled: false }
        },
        {
          name: '2 Ext',
          singleCar: ['EXT', 'EXT'],
          multiCar: {
            visit1: { car1: 'EXT', car2: 'EXT' },
            visit2: { car1: 'EXT', car2: 'EXT' }
          },
          biWeekly: { enabled: false }
        }
      ];
    }
    
    const rules = activeRules.map(row => ({
      name: row.RuleName,
      singleCar: JSON.parse(row.SingleCarPattern || '["EXT"]'),
      multiCar: JSON.parse(row.MultiCarSettings || '{"visit1": {"car1": "EXT", "car2": "EXT"}}'),
      biWeekly: JSON.parse(row.BiWeeklySettings || '{"enabled": false}')
    }));
    
    return rules;
  } catch (error) {
    console.error('Error getting wash rules:', error);
    // Return default rules on error
    return [
      {
        name: '2 Ext 1 INT week',
        singleCar: ['EXT', 'EXT', 'INT'],
        multiCar: {
          visit1: { car1: 'EXT', car2: 'EXT' },
          visit2: { car1: 'EXT', car2: 'EXT' },
          visit3: { car1: 'INT', car2: 'EXT' }
        },
        biWeekly: { enabled: false }
      }
    ];
  }
};

const autoAssignSchedule = async (req, res) => {
  const weekOffset = parseInt(req.params.weekOffset) || 0;
  const showAllSlots = req.body.showAllSlots === true;
  
  try {
    // 1. Fetch All Data with rate limiting
    console.log('[API-LIMIT] Fetching data with rate limiting...');
    const customers = await getCustomers();
    const workers = await getWorkers();
    const allHistory = await getAllHistory();
    const existingSchedule = await getScheduledTasks();
    
    // 2. Filter customers based on mode
    let activeCustomers;
    if (showAllSlots === true || showAllSlots === 'true') {
      // Show all active and booked customers for capacity planning
      activeCustomers = customers.filter(c => c.Status === 'Active' || c.Status === 'Booked');
    } else {
      // Normal mode: include Active and Booked customers, filter out completed tasks
      activeCustomers = customers.filter(c => c.Status === 'Active' || c.Status === 'Booked');
    }
    
    // Normalize status comparison (case-insensitive) to avoid excluding workers due to casing or empty values
    const activeWorkers = workers.filter(worker => ((worker.Status || '').toString().toLowerCase() === 'active'));
    
    if (activeWorkers.length === 0) {
      return res.status(400).json({ success: false, error: 'No active workers found.' });
    }
    
    // 3. Clean up completed tasks from ScheduledTasks
    const cleanedSchedule = existingSchedule.filter(task => {
      if (!task.AppointmentDate) return true; // Keep tasks without date
      
      const taskDate = new Date(task.AppointmentDate);
      const isCompleted = allHistory.some(record => 
        record.CustomerID === task.CustomerID &&
        record.CarPlate === (task.CarPlate || '') &&
        parseHistoryDate(record.WashDate).toDateString() === taskDate.toDateString()
      );
      
      if (isCompleted) {
        return false;
      }
      return true;
    });
    
    // Update ScheduledTasks if any tasks were removed
    if (cleanedSchedule.length !== existingSchedule.length) {
      const cleanedTasks = cleanedSchedule.map(task => ({
        day: task.Day,
        appointmentDate: task.AppointmentDate || '',
        time: task.Time,
        customerId: task.CustomerID,
        customerName: task.CustomerName,
        villa: task.Villa,
        carPlate: task.CarPlate,
        washType: task.WashType,
        workerName: task.WorkerName,
        workerId: task.WorkerID,
        packageType: task.PackageType || '',
        isLocked: task.isLocked || 'FALSE',
        scheduleDate: task.ScheduleDate || new Date().toISOString().split('T')[0]
      }));
      await clearAndWriteSheet('ScheduledTasks', cleanedTasks);
    }
    
    // 4. Identify Locked Tasks
    const lockedTasks = cleanedSchedule.filter(task => task.isLocked === 'TRUE');
    
    // 4. Generate All Potential New Appointments
    const appointmentResult = await generateAllAppointments(activeCustomers, allHistory, weekOffset, showAllSlots);
    const potentialAppointments = appointmentResult.appointments || appointmentResult;
    const manualInputCustomers = appointmentResult.manualInputRequired || [];
    
    // Add actual dates to appointments
    const appointmentsWithDates = addActualDatesToAppointments(potentialAppointments, weekOffset);
    
    // 4. Get completed tasks for this week
    const completedTasksThisWeek = getCompletedTasksForWeek(allHistory, weekOffset);
    
    // 5. Filter appointments based on mode
    let unlockedAppointments;
    if (showAllSlots) {
      // Show All Slots: Don't filter out completed tasks, show everything
      unlockedAppointments = filterUnlockedAppointments(appointmentsWithDates, lockedTasks, []);
    } else {
      // Normal mode: Filter out completed/cancelled tasks
      unlockedAppointments = filterUnlockedAppointments(appointmentsWithDates, lockedTasks, completedTasksThisWeek);
    }
    
    // 6. Assign Workers to Unlocked Tasks (Respecting Locked Worker Schedules)
    const assignedUnlockedTasks = assignWorkersToTasks(unlockedAppointments, activeWorkers, lockedTasks);
    
    // 7. Add completed tasks to schedule if Show All Slots is enabled
    let completedTasksForDisplay = [];
    if (showAllSlots) {
      completedTasksForDisplay = completedTasksThisWeek.map(completedTask => ({
        day: getDayFromDate(completedTask.WashDate, weekOffset),
        appointmentDate: completedTask.WashDate,
        time: getOriginalTimeFromHistory(completedTask) || '6:00 AM', // Use original time or default
        customerId: completedTask.CustomerID,
        customerName: completedTask.CustomerID, // Will be resolved from customers list
        villa: completedTask.Villa || 'N/A',
        carPlate: completedTask.CarPlate || '',
        washType: completedTask.Status === 'Cancelled' ? 'CANCELLED' : (completedTask.WashTypePerformed || completedTask.WashType || 'EXT'),
        originalWashType: completedTask.WashTypePerformed || completedTask.WashType || 'EXT', // Store original wash type
        workerName: completedTask.WorkerName || 'N/A',
        workerId: 'COMPLETED',
        packageType: completedTask.PackageType || '',
        isLocked: 'TRUE',
        scheduleDate: new Date().toISOString().split('T')[0],
        isCompleted: true,
        status: completedTask.Status // 'Completed' or 'Cancelled'
      })).filter(task => task.day); // Only include tasks with valid days
    }
    
    // 8. Combine Locked, Newly Assigned, and Completed Tasks
    const combinedSchedule = [
      ...lockedTasks.map(formatLockedTask), 
      ...assignedUnlockedTasks,
      ...completedTasksForDisplay
    ];
    
    // 7. Remove Duplicates - Enhanced logic to prevent customer duplication
    const finalSchedule = [];
    const seen = new Set();
    const tasksByKey = new Map();
    
    // First pass: collect all tasks by key and prioritize locked tasks
    combinedSchedule.forEach(task => {
      const key = `${task.customerId}-${task.day}-${task.time}-${task.carPlate || 'NOPLATE'}`;
      
      if (!tasksByKey.has(key)) {
        tasksByKey.set(key, task);
      } else {
        // If duplicate found, prioritize locked tasks over unlocked ones
        const existingTask = tasksByKey.get(key);
        if (task.isLocked === 'TRUE' && existingTask.isLocked !== 'TRUE') {
          tasksByKey.set(key, task);
        }
        // If both are locked or both are unlocked, keep the first one
      }
    });
    
    // Second pass: add unique tasks to final schedule
    tasksByKey.forEach((task, key) => {
      if (!seen.has(key)) {
        seen.add(key);
        finalSchedule.push(task);
      }
    });
    
    // 8. Save Complete Schedule
    // Only save pending/future tasks, completed tasks should only be in wash_history
    const scheduleForSaving = finalSchedule.map(task => ({
      day: task.day || '',
      appointmentDate: task.appointmentDate || '',
      time: task.time || '',
      customerId: task.customerId || '',
      customerName: task.customerName || '',
      villa: task.villa || '',
      carPlate: task.carPlate || '',
      washType: task.washType || 'EXT',
      workerName: task.workerName || '',
      workerId: task.workerId || '',
      packageType: task.packageType || '',
      isLocked: task.isLocked || 'FALSE',
      scheduleDate: task.scheduleDate || new Date().toISOString().split('T')[0]
    }));
    
    // Validate and fix schedule before saving to prevent duplicates/conflicts caused by manual edits or race conditions
    const validatedSchedule = validateAndFixSchedule(scheduleForSaving);
    await clearAndWriteSheet('ScheduledTasks', validatedSchedule);
    
    // Clear cache after update
    clearScheduleCache();
    
    let message = showAllSlots 
      ? `[TESTING] Full capacity view: ${finalSchedule.length} total slots, ${lockedTasks.length} locked tasks, ${assignedUnlockedTasks.length} available appointments, ${completedTasksForDisplay.length} completed/cancelled tasks`
      : `[TESTING] Schedule updated successfully. ${assignedUnlockedTasks.length} new appointments added, ${lockedTasks.length} locked tasks preserved, ${completedTasksThisWeek?.length || 0} completed tasks excluded.`;
    
    if (manualInputCustomers.length > 0) {
      message += ` Note: ${manualInputCustomers.length} customers require manual wash type input due to incomplete bi-weekly cycle data.`;
    }
    
    res.json({
      success: true,
      message,
      totalAppointments: finalSchedule.length,
      lockedTasks: lockedTasks.length,
      newAssignments: assignedUnlockedTasks.length,
      completedTasks: showAllSlots ? completedTasksForDisplay.length : (completedTasksThisWeek?.length || 0),
      showAllSlots,
      manualInputRequired: manualInputCustomers,
      assignments: finalSchedule
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Helper functions
function parseHistoryDate(dateStr) {
  if (!dateStr) return new Date(0);
  
  // Handle DD-MMM-YYYY format (e.g., 8-Oct-2025)
  const months = {'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
                 'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11};
  const parts = dateStr.split('-');
  if (parts.length === 3 && months[parts[1]] !== undefined) {
    const day = parseInt(parts[0]);
    const month = months[parts[1]];
    const year = parseInt(parts[2]);
    return new Date(year, month, day);
  }
  
  // Fallback to standard date parsing
  return new Date(dateStr);
}

// Simple cache for schedule data
let scheduleCache = {
  data: null,
  timestamp: 0,
  ttl: 30000 // 30 seconds
};

// Clear cache when schedule is updated
const clearScheduleCache = () => {
  scheduleCache.data = null;
  scheduleCache.timestamp = 0;
};

// Placeholder functions - implement as needed
async function generateAllAppointments(customers, allHistory, weekOffset, showAllSlots) {
  return { appointments: [], manualInputRequired: [] };
}

function addActualDatesToAppointments(appointments, weekOffset) {
  return appointments;
}

function getCompletedTasksForWeek(allHistory, weekOffset) {
  return [];
}

function filterUnlockedAppointments(appointments, lockedTasks, completedTasks) {
  return appointments;
}

function assignWorkersToTasks(appointments, workers, lockedTasks) {
  return appointments;
}

function formatLockedTask(task) {
  return task;
}

function validateAndFixSchedule(schedule) {
  return schedule;
}

function getDayFromDate(dateStr, weekOffset) {
  return 'Monday';
}

function getOriginalTimeFromHistory(task) {
  return '6:00 AM';
}

module.exports = { 
  autoAssignSchedule,
  clearScheduleCache
};