const { getCustomers, getWorkers, getAllHistory, getScheduledTasks, clearAndWriteSheet, addRowToSheet, addAuditLog, updateTaskInSheet, getSheetData } = require('../../services/googleSheetsService');
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
    if (!washRulesData || washRulesData.length === 0) {
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
    
    const rules = washRulesData.map(row => ({
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

// Calculate wash type using ONLY rules from Excel
const calculateWashTypeFromRules = async (customer, carPlate) => {
  try {
    const packageType = customer.Washman_Package || '';
    const rules = await getWashRules();
    const rule = rules.find(r => r.name.trim().toLowerCase() === packageType.trim().toLowerCase());
    
    if (!rule) {
      return 'EXT';
    }
    
    // Get customer history for last 2 weeks
    const historyData = await getAllHistory();
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const recentHistory = historyData.filter(record => {
      if (record.CustomerID !== customer.CustomerID) return false;
      const washDate = parseHistoryDate(record.WashDate);
      return washDate >= twoWeeksAgo;
    }).sort((a, b) => new Date(b.WashDate) - new Date(a.WashDate));
    
    // Parse car plates from customer data
    const carPlates = (customer.CarPlates || '').split(',').map(p => p.trim()).filter(p => p);
    
    // Determine next visit number based on recent pattern
    const visitNumber = determineNextVisitFromHistory(recentHistory, rule.singleCar.length);
    
    // Handle multi-car logic using manual configuration from Excel
    if (carPlates.length > 1 && rule.multiCar) {
      const visitKey = `visit${visitNumber}`;
      const visitConfig = rule.multiCar[visitKey];
      
      if (visitConfig) {
        const carIndex = carPlates.findIndex(plate => plate === carPlate);
        const carKey = `car${carIndex + 1}`;
        return visitConfig[carKey] || 'EXT';
      }
    }
    
    // Single car - get wash type from rule
    return rule.singleCar[visitNumber - 1] || 'EXT';
    
  } catch (error) {
    console.error('Error calculating wash type from rules:', error);
    return 'EXT';
  }
};

// Helper function to determine next visit number from history pattern
const determineNextVisitFromHistory = (recentHistory, patternLength) => {
  if (recentHistory.length === 0) {
    return 1;
  }
  
  const completedVisits = recentHistory.length;
  const nextVisit = (completedVisits % patternLength) + 1;
  
  return nextVisit;
};

const autoAssignSchedule = async (req, res) => {
  const weekOffset = parseInt(req.params.weekOffset) || 0;
  const showAllSlots = req.body.showAllSlots === true;
  
  const today = new Date();
  
  try {
    // 1. Fetch All Data with rate limiting
    console.log('[API-LIMIT] Fetching data with rate limiting...');
    const customers = await rateLimitedApiCall(() => getCustomers());
    const workers = await rateLimitedApiCall(() => getWorkers());
    const allHistory = await rateLimitedApiCall(() => getAllHistory());
    const existingSchedule = await rateLimitedApiCall(() => getScheduledTasks());
    
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
      await rateLimitedApiCall(() => clearAndWriteSheet('ScheduledTasks', cleanedTasks));

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
    

    
    const endTime = new Date();

    
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

async function generateAllAppointments(customers, allHistory, weekOffset, showAllSlots = false) {
  const appointments = [];
  const manualInputRequired = [];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = ['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'];
  
  for (const customer of customers) {
    if (!customer || (customer.Status !== 'Active' && customer.Status !== 'Booked') || !customer.CustomerID) continue;
    
    // Store start date for later filtering per appointment
    const customerStartDate = customer['start date'] ? parseCustomerStartDate(customer['start date']) : null;
    
    const timeField = customer.Time || '';
    const daysField = customer.Days || '';
    const notesField = customer.Notes || '';
    const carPlates = (customer.CarPlates || '').split(',').map(p => p.trim()).filter(p => p);
    if (carPlates.length === 0) carPlates.push('');
    
    // For multi-car customers, track visit counter for alternating INT (per day, not per car)
    let visitCounter = 0;
    const processedDays = new Set(); // Track which days we've processed
    
    // Parse specific day/time overrides from Notes
    const specificPattern = /(Sat|Mon|Tue|Wed|Thu|Thurs|Fri)[@\s]*(at\s*)?(\d{1,2}:\d{2}\s*(AM|PM))/gi;
    const specificMatches = [];
    let match;
    
    while ((match = specificPattern.exec(notesField)) !== null) {
      const dayName = expandDayName(match[1]);
      const timeStr = match[3];
      specificMatches.push({ day: dayName, time: timeStr });
    }
    
    const specificDays = specificMatches.map(m => m.day);
    const customerDays = parseDaysField(daysField);
    
    // Check if Time field contains day@time format
    const dayTimePattern = /(Sat|Mon|Tue|Wed|Thu|Thurs|Fri)@(\d{1,2}:\d{2}\s*(AM|PM))/gi;
    const dayTimeMatches = [];
    let dayTimeMatch;
    
    while ((dayTimeMatch = dayTimePattern.exec(timeField)) !== null) {
      const dayName = expandDayName(dayTimeMatch[1]);
      const timeStr = dayTimeMatch[2];
      dayTimeMatches.push({ day: dayName, time: timeStr });
    }
    
    // Check if Time field contains car@time format (e.g., "6:00 AM Lincoln, 11:00 AM Cadillac")
    const carTimePattern = /(\d{1,2}:\d{2}\s*(AM|PM))\s+([^,]+)/gi;
    const carTimeMatches = [];
    let carTimeMatch;
    
    while ((carTimeMatch = carTimePattern.exec(timeField)) !== null) {
      const timeStr = carTimeMatch[1];
      const carName = carTimeMatch[3].trim();
      carTimeMatches.push({ time: timeStr, car: carName });
    }
    
    // Generate appointments from car@time format in Time field (e.g., "6:00 AM Lincoln, 11:00 AM Cadillac")
    if (carTimeMatches.length > 0) {
      for (const [dayIndex, day] of customerDays.entries()) {
        if (days.includes(day)) {
          // For multi-car customers, determine which car gets INT for this day
          let intCarForThisVisit = null;
          if (carPlates.length > 1) {
            intCarForThisVisit = determineIntCarForCustomer(carPlates, allHistory, dayIndex, weekOffset);
          }
          
          for (const [index, carTime] of carTimeMatches.entries()) {
            if (timeSlots.includes(carTime.time)) {
              // Find matching car plate
              const matchingCarPlate = carPlates.find(plate => 
                plate.toLowerCase().includes(carTime.car.toLowerCase()) || 
                carTime.car.toLowerCase().includes(plate.toLowerCase())
              ) || carTime.car;
              
              // Calculate visit number based on customer's own day sequence
              const visitNumber = customerDays.indexOf(day) + 1;
              const washType = await calculateHistoryBasedWashType(customer, matchingCarPlate, allHistory, visitNumber, weekOffset, intCarForThisVisit, showAllSlots);
              
              if (washType === 'SKIP') {
                continue;
              }
              
              // Check if appointment date is on or after customer start date
              const appointmentDate = getAppointmentDate(day, weekOffset);
              if (!showAllSlots && customerStartDate && appointmentDate < customerStartDate) {
                continue;
              }
              
              appointments.push({
                day,
                time: carTime.time,
                customerId: customer.CustomerID,
                customerName: customer.Name,
                villa: customer.Villa,
                carPlate: matchingCarPlate,
                washType,
                packageType: customer.Washman_Package || '',
                customerStatus: customer.Status // Add customer status
              });
            }
          }
        }
      }
    }
    // Generate appointments from day@time format in Time field
    else if (dayTimeMatches.length > 0) {
      for (const [index, dayTime] of dayTimeMatches.entries()) {
        if (days.includes(dayTime.day) && timeSlots.includes(dayTime.time)) {
          // For multi-car customers, determine which car gets INT for this visit
          let intCarForThisVisit = null;
          if (carPlates.length > 1) {
            visitCounter++;
            intCarForThisVisit = determineIntCarForCustomer(carPlates, allHistory, visitCounter - 1, weekOffset);
          }
          
          for (const carPlate of carPlates) {
            // Calculate visit number based on customer's own day sequence
            const visitNumber = customerDays.indexOf(dayTime.day) + 1;
            const washType = await calculateHistoryBasedWashType(customer, carPlate, allHistory, visitNumber, weekOffset, intCarForThisVisit, showAllSlots);
            
            if (washType === 'SKIP') {
              continue;
            }
            
            // Check if appointment date is on or after customer start date
            const appointmentDate = getAppointmentDate(dayTime.day, weekOffset);
            if (!showAllSlots && customerStartDate && appointmentDate < customerStartDate) {
              continue;
            }
            
            appointments.push({
              day: dayTime.day,
              time: dayTime.time,
              customerId: customer.CustomerID,
              customerName: customer.Name,
              villa: customer.Villa,
              carPlate,
              washType,
              packageType: customer.Washman_Package || '',
              customerStatus: customer.Status // Add customer status
            });
          }
        }
      }
    }
    // Generate regular appointments (only if no day@time format found)
    else if (daysField && timeField) {
      const times = timeField.includes('&') ? timeField.split('&').map(t => t.trim()) : [timeField.trim()];
      
      for (const [dayIndex, day] of customerDays.entries()) {
        if (days.includes(day)) {
          const hasSpecificOverride = specificDays.includes(day);
          
          if (!hasSpecificOverride) {
            // For multi-car customers, determine which car gets INT for this day
            let intCarForThisVisit = null;
            if (carPlates.length > 1) {
              intCarForThisVisit = determineIntCarForCustomer(carPlates, allHistory, dayIndex, weekOffset);
            }
            
            for (const time of times) {
              if (timeSlots.includes(time)) {
                
                for (const carPlate of carPlates) {
                  // Calculate visit number based on customer's own day sequence
                  const visitNumber = customerDays.indexOf(day) + 1;
                  const washType = await calculateHistoryBasedWashType(customer, carPlate, allHistory, visitNumber, weekOffset, intCarForThisVisit, showAllSlots);
                  
                  if (washType === 'SKIP') {
                    continue;
                  }
                  
                  // Check if appointment date is on or after customer start date
                  const appointmentDate = getAppointmentDate(day, weekOffset);
                  if (!showAllSlots && customerStartDate && appointmentDate < customerStartDate) {
                    continue;
                  }
                  
                  appointments.push({
                    day,
                    time,
                    customerId: customer.CustomerID,
                    customerName: customer.Name,
                    villa: customer.Villa,
                    carPlate,
                    washType,
                    packageType: customer.Washman_Package || '',
                    customerStatus: customer.Status // Add customer status
                  });
                }
              }
            }
          }
        }
      }
    }
    
    // Add specific appointments from Notes
    for (const [index, appointment] of specificMatches.entries()) {
      if (days.includes(appointment.day) && timeSlots.includes(appointment.time)) {
        // Find day index for this specific appointment
        const dayIndex = customerDays.indexOf(appointment.day);
        
        // For multi-car customers, determine which car gets INT for this day
        let intCarForThisVisit = null;
        if (carPlates.length > 1) {
          intCarForThisVisit = determineIntCarForCustomer(carPlates, allHistory, dayIndex >= 0 ? dayIndex : index, weekOffset);
        }
        
        for (const carPlate of carPlates) {
          // Calculate visit number based on customer's own day sequence
          const visitNumber = customerDays.indexOf(appointment.day) + 1;
          const washType = await calculateHistoryBasedWashType(customer, carPlate, allHistory, visitNumber, weekOffset, intCarForThisVisit, showAllSlots);
          
          if (washType === 'SKIP') {
            continue;
          }
          
          // Check if appointment date is on or after customer start date
          const appointmentDate = getAppointmentDate(appointment.day, weekOffset);
          if (!showAllSlots && customerStartDate && appointmentDate < customerStartDate) {
            continue;
          }
          
          appointments.push({
            day: appointment.day,
            time: appointment.time,
            customerId: customer.CustomerID,
            customerName: customer.Name,
            villa: customer.Villa,
            carPlate,
            washType,
            packageType: customer.Washman_Package || '',
            customerStatus: customer.Status // Add customer status
          });
        }
      }
    }
  }
  
  // Remove duplicates
  const uniqueAppointments = [];
  const seen = new Set();
  appointments.forEach(apt => {
    const key = `${apt.customerId}-${apt.day}-${apt.time}-${apt.carPlate}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueAppointments.push(apt);
    }
  });
  
  // Remove duplicate manual input requests
  const uniqueManualInput = [];
  const seenManual = new Set();
  manualInputRequired.forEach(req => {
    const key = `${req.customerId}-${req.day}-${req.time}-${req.carPlate}`;
    if (!seenManual.has(key)) {
      seenManual.add(key);
      uniqueManualInput.push(req);
    }
  });
  
  return {
    appointments: uniqueAppointments,
    manualInputRequired: uniqueManualInput
  };
}

function filterUnlockedAppointments(potentialAppointments, lockedTasks, completedTasks = []) {
  
  return potentialAppointments.filter(appointment => {
    // Check if this appointment is already covered by a locked task
    const isLocked = lockedTasks.some(lockedTask => 
      lockedTask.CustomerID === appointment.customerId &&
      lockedTask.Day === appointment.day &&
      lockedTask.Time === appointment.time &&
      lockedTask.CarPlate === appointment.carPlate
    );
    
    if (isLocked) {
      return false;
    }
    
    // Check if this specific appointment is already completed
    const isCompleted = completedTasks.some(completedTask => {
      const matchesCustomer = completedTask.CustomerID === appointment.customerId;
      const matchesCar = completedTask.CarPlate === appointment.carPlate;
      
      if (!appointment.actualDate) {
        return false;
      }
      
      const completedDate = parseHistoryDate(completedTask.WashDate);
      const appointmentDate = new Date(appointment.actualDate);
      const matchesDate = completedDate.toDateString() === appointmentDate.toDateString();
      

      
      if (matchesCustomer && matchesCar && matchesDate) {
        return true;
      }
      
      return false;
    });
    

    
    return !isCompleted;
  });
}

function assignWorkersToTasks(unlockedAppointments, activeWorkers, lockedTasks) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = ['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'];
  
  // Group tasks by time slot
  const timeSlotGroups = {};
  unlockedAppointments.forEach(appointment => {
    const timeSlotKey = `${appointment.day}-${appointment.time}`;
    if (!timeSlotGroups[timeSlotKey]) {
      timeSlotGroups[timeSlotKey] = [];
    }
    timeSlotGroups[timeSlotKey].push(appointment);
  });
  
  // Process each time slot chronologically
  const sortedTimeSlots = Object.keys(timeSlotGroups).sort((a, b) => {
    const [dayA, timeA] = a.split('-');
    const [dayB, timeB] = b.split('-');
    const dayOrder = days.indexOf(dayA) - days.indexOf(dayB);
    if (dayOrder !== 0) return dayOrder;
    return timeSlots.indexOf(timeA) - timeSlots.indexOf(timeB);
  });
  
  const assignedTasks = [];
  let workerIndex = 0; // Simple round-robin counter
  
  sortedTimeSlots.forEach(timeSlotKey => {
    const tasks = timeSlotGroups[timeSlotKey];
    const [day, time] = timeSlotKey.split('-');
    
    // Get workers busy with locked tasks at this time slot
    const busyWorkers = lockedTasks
      .filter(task => task.Day === day && task.Time === time)
      .map(task => task.WorkerName || task.workerName)
      .filter(Boolean);
    
    const workerCustomerMap = {}; // customerID -> worker mapping for this time slot
    
    tasks.forEach(task => {
      let assigned = false;
      
      // First, check if there's already a worker assigned to this customer
      if (workerCustomerMap[task.customerId]) {
        const assignedWorker = workerCustomerMap[task.customerId];
        task.workerName = assignedWorker.Name;
        task.workerId = assignedWorker.WorkerID;
        task.isLocked = 'FALSE';
        assigned = true;
      } else {
        // Get available workers for this time slot
        const availableWorkers = activeWorkers.filter(worker => 
          !busyWorkers.includes(worker.Name) && 
          !Object.values(workerCustomerMap).some(w => w.Name === worker.Name)
        );
        
        if (availableWorkers.length > 0) {
          // Simple round-robin assignment
          const worker = availableWorkers[workerIndex % availableWorkers.length];
          workerIndex++;

          task.workerName = worker.Name;
          task.workerId = worker.WorkerID;
          task.isLocked = 'FALSE';
          workerCustomerMap[task.customerId] = worker;
          assigned = true;
        }
      }
      
      if (assigned) {
        task.appointmentDate = task.actualDate || '';
        task.scheduleDate = new Date().toISOString().split('T')[0];
        assignedTasks.push(task);
      }
    });
  });
  
  return assignedTasks;
}

function formatLockedTask(lockedTask) {
  return {
    day: lockedTask.Day,
    appointmentDate: lockedTask.AppointmentDate || '',
    time: lockedTask.Time,
    customerId: lockedTask.CustomerID,
    customerName: lockedTask.CustomerName,
    villa: lockedTask.Villa,
    carPlate: lockedTask.CarPlate || '',
    washType: lockedTask.WashType || 'EXT',
    workerName: lockedTask.WorkerName,
    workerId: lockedTask.WorkerID,
    packageType: lockedTask.PackageType || '',
    isLocked: 'TRUE',
    scheduleDate: lockedTask.ScheduleDate || new Date().toISOString().split('T')[0],
    isBiWeekly: lockedTask.PackageType?.includes('bi week') || false,
    customerStatus: lockedTask.customerStatus || 'Active'
  };
}

/**
 * Validate and fix schedule array before saving.
 * Rules enforced:
 * 1) For each slot (appointmentDate/day + time) a customerId must have at most one worker.
 *    If multiple tasks exist for same customer in same slot, keep the locked task if any, else keep the first and clear others.
 * 2) For each slot a workerId must not be assigned to more than one customer.
 *    If a worker is assigned to multiple customers in the same slot, keep only the first assignment and clear the rest (they become unassigned so auto-assign can fill them later).
 */
function validateAndFixSchedule(schedule) {
  if (!Array.isArray(schedule)) return schedule;

  const slotMap = new Map(); // slotKey -> array of tasks
  const conflicts = { customerDuplicates: [], workerDoubleBooking: [] };

  const normalize = v => (v === undefined || v === null) ? '' : String(v).trim();

  // Group tasks by slot
  schedule.forEach(task => {
    const slotKey = `${normalize(task.appointmentDate) || normalize(task.day)}||${normalize(task.time)}`;
    if (!slotMap.has(slotKey)) slotMap.set(slotKey, []);
    slotMap.get(slotKey).push(task);
  });

  const cleaned = [];

  // Process each slot independently
  for (const [slotKey, tasks] of slotMap.entries()) {
    // 1) Allow multiple cars per customer, but ensure unique customer+car combinations
    const byCustomerCar = new Map(); // customerId+carPlate -> task kept

    for (const t of tasks) {
      const cid = normalize(t.customerId);
      const carPlate = normalize(t.carPlate || t.CarPlate || 'NOPLATE');
      const customerCarKey = `${cid}||${carPlate}`;

      if (!byCustomerCar.has(customerCarKey)) {
        byCustomerCar.set(customerCarKey, t);
      } else {
        const existing = byCustomerCar.get(customerCarKey);
        // Prefer locked task
        const existingLocked = (existing.isLocked || '').toString() === 'TRUE';
        const currentLocked = (t.isLocked || '').toString() === 'TRUE';
        
        // Log the conflict - same customer+car has multiple appointments in same slot
        conflicts.customerDuplicates.push({ 
          slot: slotKey, 
          customerId: cid, 
          carPlate: carPlate,
          error: 'Same customer+car cannot have multiple appointments in same time slot',
          kept: { 
            workerId: normalize(existing.workerId), 
            locked: existingLocked 
          }, 
          removed: { 
            workerId: normalize(t.workerId)
          } 
        });
        
        // Only replace if current is locked and existing isn't
        if (currentLocked && !existingLocked) {
          byCustomerCar.set(customerCarKey, t);
        }
      }
    }

    // 2) Ensure worker not assigned twice in same slot
    const workerSeen = new Map(); // workerId -> task

    for (const [custCarKey, task] of byCustomerCar.entries()) {
      const wid = normalize(task.workerId) || normalize(task.workerName) || '';
      if (!wid) {
        // unassigned task, keep as is
        cleaned.push(task);
        continue;
      }

      if (!workerSeen.has(wid)) {
        workerSeen.set(wid, task);
        cleaned.push(task);
      } else {
        const kept = workerSeen.get(wid);
        // If the existing assignment with this worker is for the same customer, allow multiple car assignments
        const existingCustomer = normalize(kept.customerId);
        const currentCustomer = normalize(task.customerId);
        if (existingCustomer === currentCustomer) {
          // Same customer, different car -> allow assignment
          cleaned.push(task);
        } else {
          // Worker already assigned to a different customer in same slot -> clear this task's worker fields
          conflicts.workerDoubleBooking.push({ slot: slotKey, workerId: wid, keptCustomer: existingCustomer, removedCustomer: currentCustomer, removedCar: normalize(task.carPlate || task.CarPlate || '') });
          // Clear assignment on the conflicting task so it becomes unassigned
          task.workerId = '';
          task.workerName = '';
          // keep the task (unassigned) so it can be re-assigned later
          cleaned.push(task);
        }
      }
    }
  }

  // Log conflicts for debugging
  try {
    logger.assignment({ type: 'validate-schedule', totalInput: schedule.length, totalOutput: cleaned.length, conflicts, timestamp: new Date().toISOString() });
  } catch (e) { /* swallow logger errors */ }

  return cleaned;
}

// Keep existing functions for other endpoints
// Simple cache for schedule data
let scheduleCache = {
  data: null,
  timestamp: 0,
  ttl: 30000 // 30 seconds
};

const getSchedule = async (req, res) => {
  try {
    const now = Date.now();
    
    // Check cache first
    if (scheduleCache.data && (now - scheduleCache.timestamp) < scheduleCache.ttl) {
      console.log('[CACHE] Returning cached schedule data');
      return res.json(scheduleCache.data);
    }
    
    const scheduledTasks = await rateLimitedApiCall(() => getScheduledTasks());
    
    const assignments = scheduledTasks.map(task => ({
      day: task.Day,
      appointmentDate: task.AppointmentDate || '',
      time: task.Time,
      customerId: task.CustomerID,
      customerName: task.CustomerName,
      villa: task.Villa,
      carPlate: task.CarPlate,
      washType: (typeof task.WashType === 'string' && task.WashType !== '[object Promise]') ? task.WashType : 'EXT',
      workerName: task.WorkerName,
      workerId: task.WorkerID,
      packageType: task.PackageType || '',
      isLocked: task.isLocked || 'FALSE',
      scheduleDate: task.ScheduleDate || new Date().toISOString().split('T')[0],
      status: task.Status,
      originalWashType: task.OriginalWashType,
      customerStatus: task.customerStatus || 'Active'
    }));
    
    // Log manual appointments for debugging
    const manualAppointments = assignments.filter(apt => apt.customerId && apt.customerId.startsWith('MANUAL_'));
    console.log(`[GET-SCHEDULE] Total assignments: ${assignments.length}`);
    console.log(`[GET-SCHEDULE] Manual appointments: ${manualAppointments.length}`);
    if (manualAppointments.length > 0) {
      console.log('[GET-SCHEDULE] Manual appointments found:', manualAppointments);
    }
    
    // Log CUST-047 appointments for debugging
    const cust047Appointments = assignments.filter(apt => apt.customerId === 'CUST-047');
    console.log(`[GET-SCHEDULE] CUST-047 appointments found: ${cust047Appointments.length}`);
    if (cust047Appointments.length > 0) {
      console.log('[GET-SCHEDULE] CUST-047 appointments:', cust047Appointments.map(apt => ({
        day: apt.day,
        time: apt.time,
        villa: apt.villa,
        carPlate: apt.carPlate,
        washType: apt.washType,
        workerName: apt.workerName
      })));
    }
    
    const response = {
      success: true,
      message: assignments.length > 0 ? 'Schedule loaded successfully' : 'No schedule data found',
      totalAppointments: assignments.length,
      assignments
    };
    
    // Update cache
    scheduleCache = {
      data: response,
      timestamp: now,
      ttl: 30000
    };
    
    res.json(response);
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Clear cache when schedule is updated
const clearScheduleCache = () => {
  scheduleCache.data = null;
  scheduleCache.timestamp = 0;
};

const getAvailableWorkers = async (req, res) => {
  try {
    const { day, time } = req.query;
    
    if (!day || !time) {
      return res.status(400).json({ 
        success: false, 
        error: 'Day and time are required' 
      });
    }
    
    const workers = await getWorkers();
    const activeWorkers = workers.filter(worker => worker.Status === 'Active');
    const existingTasks = await getScheduledTasks();
    
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
    res.status(500).json({ success: false, error: error.message });
  }
};

const addManualAppointment = async (req, res) => {
  try {
    const { customerName, villa, day, time, workerName, washType, carPlate } = req.body;
    
    if (!customerName || !villa || !day || !time || !workerName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: customerName, villa, day, time, workerName' 
      });
    }
    
    const workers = await getWorkers();
    const worker = workers.find(w => w.Name === workerName && w.Status === 'Active');
    
    if (!worker) {
      return res.status(400).json({ 
        success: false, 
        error: `Worker '${workerName}' not found or inactive` 
      });
    }
    
    const existingTasks = await getScheduledTasks();
    
    // Check if worker is busy with a DIFFERENT customer at this time
    const workerConflict = existingTasks.find(task => 
      task.WorkerName === workerName && 
      task.Day === day && 
      task.Time === time &&
      task.CustomerName !== customerName // Allow same customer multiple cars
    );
    
    if (workerConflict) {
      return res.status(400).json({ 
        success: false, 
        error: `Worker ${workerName} is already assigned to ${workerConflict.CustomerName} at ${day} ${time}` 
      });
    }
    
    // Calculate appointment date based on day
    const today = new Date();
    const currentDay = today.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetDayIndex = dayNames.indexOf(day);
    
    let appointmentDate = new Date(today);
    let daysToAdd = targetDayIndex - currentDay;
    if (daysToAdd <= 0) daysToAdd += 7; // Next week if day has passed
    appointmentDate.setDate(today.getDate() + daysToAdd);
    
    const formattedDate = appointmentDate.toISOString().split('T')[0];
    
    // Create single appointment for one car
    const customerId = `MANUAL_${Date.now()}`;
    const appointment = {
      day,
      appointmentDate: formattedDate,
      time,
      customerId,
      customerName,
      villa,
      carPlate: carPlate || '',
      washType: washType || 'EXT',
      workerName,
      workerId: worker.WorkerID,
      packageType: 'Manual Appointment',
      isLocked: 'TRUE',
      scheduleDate: new Date().toISOString().split('T')[0],
      customerStatus: 'Manual'
    };
    
    // Add appointment to the existing schedule
    const existingSchedule = await getScheduledTasks();
    const updatedSchedule = [...existingSchedule, appointment];
    
    // Save the complete updated schedule
    const formattedSchedule = updatedSchedule.map(task => ({
      day: task.day || task.Day,
      appointmentDate: task.appointmentDate || task.AppointmentDate || '',
      time: task.time || task.Time,
      customerId: task.customerId || task.CustomerID,
      customerName: task.customerName || task.CustomerName,
      villa: task.villa || task.Villa,
      carPlate: task.carPlate || task.CarPlate || '',
      washType: task.washType || task.WashType || 'EXT',
      workerName: task.workerName || task.WorkerName,
      workerId: task.workerId || task.WorkerID,
      packageType: task.packageType || task.PackageType || '',
      isLocked: task.isLocked || 'FALSE',
      scheduleDate: task.scheduleDate || task.ScheduleDate || new Date().toISOString().split('T')[0],
      customerStatus: task.customerStatus || 'Active'
    }));
    
    await clearAndWriteSheet('ScheduledTasks', formattedSchedule);
    
    // Clear cache after adding manual appointment
    clearScheduleCache();
    
    console.log(`[MANUAL-APPOINTMENT] Successfully added manual appointment:`);
    console.log(`[MANUAL-APPOINTMENT] Customer: ${customerName}, Villa: ${villa}, Day: ${day}, Time: ${time}, Worker: ${workerName}`);
    console.log(`[MANUAL-APPOINTMENT] Car plate: ${carPlate}, Wash type: ${washType}`);
    console.log(`[MANUAL-APPOINTMENT] Total schedule items after adding: ${formattedSchedule.length}`);
    
    res.json({
      success: true,
      message: 'Manual appointment added and locked successfully',
      appointment: appointment,
      totalScheduleItems: formattedSchedule.length
    });
    
  } catch (error) {
    console.error('[MANUAL-APPOINTMENT] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateTaskAssignment = async (req, res) => {
  try {
    const { taskId, newWorkerName, newWashType, isSlotSwap, sourceDay, sourceTime, targetDay, targetTime, isWashTypeOnly } = req.body;
    

    
    if (!taskId || !newWorkerName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: taskId, newWorkerName' 
      });
    }
    
    const workers = await getWorkers();
    const newWorker = workers.find(w => w.Name === newWorkerName && w.Status === 'Active');
    
    if (!newWorker) {
      return res.status(400).json({ 
        success: false, 
        error: `Worker '${newWorkerName}' not found or inactive` 
      });
    }
    
    const existingTasks = await getScheduledTasks();
    
    if (isSlotSwap && sourceDay && sourceTime && targetDay && targetTime) {

      // Handle slot swap - swap all tasks between two time slots
      // Parse taskId to get components for slot swap
      const taskIdParts = taskId.split('-');
      const customerId = `${taskIdParts[0]}-${taskIdParts[1]}`;
      const day = taskIdParts[2];
      const carPlate = taskIdParts.slice(4).join('-') || '';
      

      
      const sourceWorkerName = existingTasks.find(t => 
        (t.CustomerID || t.customerId) === customerId &&
        (t.Day || t.day) === day &&
        ((t.CarPlate || t.carPlate) || 'NOPLATE') === (carPlate === 'NOPLATE' ? '' : carPlate)
      )?.WorkerName || existingTasks.find(t => 
        (t.CustomerID || t.customerId) === customerId &&
        (t.Day || t.day) === day &&
        ((t.CarPlate || t.carPlate) || 'NOPLATE') === (carPlate === 'NOPLATE' ? '' : carPlate)
      )?.workerName;
      
      const sourceWorker = workers.find(w => w.Name === sourceWorkerName);
      

      
      // Update tasks in existingTasks array directly
      let sourceTasksUpdated = 0;
      let targetTasksUpdated = 0;
      
      existingTasks.forEach(task => {
        const taskWorkerName = task.WorkerName || task.workerName;
        const taskDay = task.Day || task.day;
        const taskTime = task.Time || task.time;
        
        // Swap source slot tasks to target worker
        if (taskWorkerName === sourceWorkerName && 
            taskDay === sourceDay && 
            taskTime === sourceTime) {
          if (task.WorkerName !== undefined) {
            task.WorkerName = newWorkerName;
            task.WorkerID = newWorker.WorkerID;
            task.isLocked = 'TRUE';
          } else {
            task.workerName = newWorkerName;
            task.workerId = newWorker.WorkerID;
            task.isLocked = 'TRUE';
          }
          sourceTasksUpdated++;

        }
        // Swap target slot tasks to source worker
        else if (taskWorkerName === newWorkerName && 
                 taskDay === targetDay && 
                 taskTime === targetTime) {
          if (task.WorkerName !== undefined) {
            task.WorkerName = sourceWorkerName;
            task.WorkerID = sourceWorker?.WorkerID || '';
            task.isLocked = 'TRUE';
          } else {
            task.workerName = sourceWorkerName;
            task.workerId = sourceWorker?.WorkerID || '';
            task.isLocked = 'TRUE';
          }
          targetTasksUpdated++;

        }
      });
      

      
    } else {

      // Handle single task update - parse taskId to get components
      // Format: CUST-001-Saturday-6:00 AM-Ford Ranger
      const taskIdParts = taskId.split('-');
      if (taskIdParts.length < 4) {

        return res.status(400).json({ 
          success: false, 
          error: 'Invalid task ID format' 
        });
      }
      
      // Extract customer ID (first two parts: CUST-001)
      const customerId = `${taskIdParts[0]}-${taskIdParts[1]}`;
      const day = taskIdParts[2];
      // Car plate is everything after the time (skip CUST-001-Saturday-6:00 AM)
      const carPlate = taskIdParts.slice(4).join('-') || '';
      

      
      // Find task by CustomerID, Day, and CarPlate (ignore time for updates)
      const taskIndex = existingTasks.findIndex(task => 
        (task.CustomerID || task.customerId) === customerId &&
        (task.Day || task.day) === day &&
        ((task.CarPlate || task.carPlate) || 'NOPLATE') === (carPlate === 'NOPLATE' ? '' : carPlate)
      );
      
      if (taskIndex === -1) {

        return res.status(404).json({ 
          success: false, 
          error: 'Task not found' 
        });
      }
      

      
      const task = existingTasks[taskIndex];
      
      // Check if this is wash type only edit or drag and drop
      if (isWashTypeOnly) {
        // Only update wash type for this specific car
        const oldWashType = existingTasks[taskIndex].WashType;
        
        if (newWashType) {
          existingTasks[taskIndex].WashType = newWashType;
        }
        

      } else {
        // Drag and drop: Remove old tasks and create new ones at target location
        const sourceDay = taskIdParts[2];
        const sourceTime = taskIdParts[3];
        
        // Parse target location from request body (should be passed from frontend)
        const targetDay = req.body.targetDay || sourceDay;
        const targetTime = req.body.targetTime || sourceTime;
        
        console.log(`[DRAG-DROP] Moving ${customerId} from ${sourceDay} ${sourceTime} to ${targetDay} ${targetTime}`);
        
        // Find all customer tasks at source location
        const customerTasksToMove = existingTasks.filter(t => 
          (t.CustomerID || t.customerId) === customerId &&
          (t.Day || t.day) === sourceDay &&
          (t.Time || t.time) === sourceTime
        );
        
        console.log(`[DRAG-DROP] Found ${customerTasksToMove.length} tasks to move`);
        
        // Remove old tasks from source location
        const tasksWithoutOld = existingTasks.filter(t => {
          const isTaskToMove = (t.CustomerID || t.customerId) === customerId &&
                              (t.Day || t.day) === sourceDay &&
                              (t.Time || t.time) === sourceTime;
          return !isTaskToMove;
        });
        
        console.log(`[DRAG-DROP] Removed ${existingTasks.length - tasksWithoutOld.length} old tasks`);
        
        // Create new tasks at target location
        const newTasks = customerTasksToMove.map(oldTask => ({
          ...oldTask,
          Day: targetDay,
          Time: targetTime,
          WorkerName: newWorkerName,
          WorkerID: newWorker.WorkerID,
          isLocked: 'TRUE'
        }));
        
        // Replace existingTasks with updated array
        existingTasks.length = 0;
        existingTasks.push(...tasksWithoutOld, ...newTasks);
        
        console.log(`[DRAG-DROP] Added ${newTasks.length} new tasks at target location`);
      }
    }
    
    // Enhanced duplicate removal - completely remove duplicates
    const uniqueTasks = [];
    const seenKeys = new Set();
    
    existingTasks.forEach(task => {
      const key = `${task.CustomerID || task.customerId}-${task.Day || task.day}-${task.Time || task.time}-${(task.CarPlate || task.carPlate) || 'NOPLATE'}`;
      
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        uniqueTasks.push(task);
      } else {
        console.log(`[UPDATE-TASK] Removing duplicate: ${key}`);
      }
    });
    
    console.log(`[UPDATE-TASK] Removed ${existingTasks.length - uniqueTasks.length} duplicate tasks`);
    
    const updatedSchedule = uniqueTasks.map(task => ({
      day: task.Day || task.day,
      appointmentDate: task.AppointmentDate || task.appointmentDate || '',
      time: task.Time || task.time,
      customerId: task.CustomerID || task.customerId,
      customerName: task.CustomerName || task.customerName,
      villa: task.Villa || task.villa,
      carPlate: (task.CarPlate || task.carPlate) || '',
      washType: (task.WashType || task.washType) || 'EXT',
      workerName: (task.WorkerName || task.workerName) || '',
      workerId: (task.WorkerID || task.workerId) || '',
      packageType: (task.PackageType || task.packageType) || '',
      isLocked: task.isLocked || 'FALSE',
      scheduleDate: (task.ScheduleDate || task.scheduleDate) || new Date().toISOString().split('T')[0],
      customerStatus: task.customerStatus || 'Active'
    }));
    
    // Clear cache before saving
    clearScheduleCache();
    
  // Validate updated schedule before saving
  const validatedUpdated = validateAndFixSchedule(updatedSchedule);
  await clearAndWriteSheet('ScheduledTasks', validatedUpdated);
    
    console.log(`[UPDATE-TASK] Successfully saved ${updatedSchedule.length} tasks to Google Sheets`);
    
    res.json({
      success: true,
      message: 'Task updated and locked successfully'
    });
    
  } catch (error) {

    res.status(500).json({ success: false, error: error.message, stack: error.stack });
  }
};

// Helper functions
// Cache for wash rules to avoid repeated API calls
let washRulesCache = {
  data: null,
  timestamp: 0,
  ttl: 300000 // 5 minutes
};

// Get wash rules with caching
const getCachedWashRules = async () => {
  const now = Date.now();
  
  if (washRulesCache.data && (now - washRulesCache.timestamp) < washRulesCache.ttl) {
    return washRulesCache.data;
  }
  
  const washRulesData = await getSheetData('WashRules');
  washRulesCache = {
    data: washRulesData || [],
    timestamp: now,
    ttl: 300000
  };
  
  return washRulesCache.data;
};

async function calculateHistoryBasedWashType(customer, carPlate, allHistory, visitNumber, weekOffset = 0, intCarForThisVisit = null, showAllSlots = false) {
  try {
    const packageType = customer.Washman_Package || '';
    const customerId = customer.CustomerID;
    
    // Load wash rules from cache
    const washRulesData = await getCachedWashRules();
    if (!washRulesData || washRulesData.length === 0) {
      return 'EXT';
    }
    
    // Find matching rule
    const rule = washRulesData.find(row => 
      row.RuleName === packageType && row.Status === 'Active'
    );
    
    if (!rule) {
      return 'EXT';
    }
    
    // Get customer's car plates
    const carPlates = (customer.CarPlates || '').split(',').map(p => p.trim()).filter(p => p);
    
    // Calculate total completed visits from history
    const customerHistory = allHistory.filter(record => 
      record.CustomerID === customerId && record.Status === 'Completed'
    );
    const totalCompletedVisits = customerHistory.length;
    
    // Calculate effective visit number based on week offset and history
    let effectiveVisitNumber;
    
    if (packageType.includes('bi week')) {
      // Bi-weekly: alternate pattern every week
      const weeksFromStart = Math.abs(weekOffset);
      const isEvenWeek = weeksFromStart % 2 === 0;
      
      if (carPlates.length <= 1) {
        // Single car bi-weekly
        const pattern = JSON.parse(rule.SingleCarPattern || '["EXT"]');
        const halfPattern = Math.ceil(pattern.length / 2);
        
        if (isEvenWeek) {
          effectiveVisitNumber = visitNumber;
        } else {
          effectiveVisitNumber = visitNumber + halfPattern;
        }
        
        const washType = pattern[(effectiveVisitNumber - 1) % pattern.length];
        return washType;
      } else {
        // Multi-car bi-weekly
        const multiCarSettings = JSON.parse(rule.MultiCarSettings || '{}');
        const totalVisits = Object.keys(multiCarSettings).length;
        const halfVisits = Math.ceil(totalVisits / 2);
        
        if (isEvenWeek) {
          effectiveVisitNumber = visitNumber;
        } else {
          effectiveVisitNumber = visitNumber + halfVisits;
        }
        
        const visitKey = `visit${((effectiveVisitNumber - 1) % totalVisits) + 1}`;
        const visitConfig = multiCarSettings[visitKey];
        
        if (!visitConfig) {
          return 'EXT';
        }
        
        const carIndex = carPlates.findIndex(plate => plate === carPlate);
        const carKey = `car${carIndex + 1}`;
        const washType = visitConfig[carKey] || 'EXT';
        return washType;
      }
    } else {
      // Regular weekly: continue pattern based on total history + current week
      const customerDaysCount = (customer.Days || '').split('-').length;
      const totalVisitsIncludingThisWeek = totalCompletedVisits + (Math.abs(weekOffset) * customerDaysCount) + visitNumber;
      
      if (carPlates.length <= 1) {
        // Single car weekly
        const pattern = JSON.parse(rule.SingleCarPattern || '["EXT"]');
        const washType = pattern[(totalVisitsIncludingThisWeek - 1) % pattern.length];
        return washType;
      } else {
        // Multi-car weekly
        const multiCarSettings = JSON.parse(rule.MultiCarSettings || '{}');
        const totalVisits = Object.keys(multiCarSettings).length;
        const visitKey = `visit${((totalVisitsIncludingThisWeek - 1) % totalVisits) + 1}`;
        const visitConfig = multiCarSettings[visitKey];
        
        if (!visitConfig) {
          return 'EXT';
        }
        
        const carIndex = carPlates.findIndex(plate => plate === carPlate);
        const carKey = `car${carIndex + 1}`;
        const washType = visitConfig[carKey] || 'EXT';
        return washType;
      }
    }
  } catch (error) {
    console.error('[WASH-RULES] Error:', error);
    return 'EXT';
  }
}

// Helper functions copied from logicService.js
function determineIntCarForCustomerFromHistory(allCarPlates, allHistory) {
  const customerHistory = allHistory.filter(record => 
    allCarPlates.includes(record.CarPlate) && record.WashType === 'INT'
  ).sort((a, b) => new Date(b.WashDate) - new Date(a.WashDate));
  
  if (customerHistory.length === 0) {
    const sortedPlates = [...allCarPlates].sort();
    return sortedPlates[0];
  }
  
  const lastIntWash = customerHistory[0];
  const lastIntCarIndex = allCarPlates.indexOf(lastIntWash.CarPlate);
  const nextIntCarIndex = (lastIntCarIndex + 1) % allCarPlates.length;
  
  return allCarPlates[nextIntCarIndex];
}

function determineIntCarForVisit(allCarPlates, allHistory, visitNumber) {
  // For multi-car customers: alternate INT between cars based on visit number
  // Visit 1: first car gets INT, Visit 2: second car gets INT, etc.
  
  // If no history exists, start with first car alphabetically
  const sortedPlates = [...allCarPlates].sort();
  
  // Check if there's any previous INT wash history
  const customerHistory = allHistory.filter(record => 
    allCarPlates.includes(record.CarPlate) && record.WashType === 'INT'
  ).sort((a, b) => new Date(b.WashDate) - new Date(a.WashDate));
  
  let baseCarIndex = 0; // Default to first car
  
  if (customerHistory.length > 0) {
    // Find which car got INT last time and continue rotation from there
    const lastIntCar = customerHistory[0].CarPlate;
    const lastIntCarIndex = sortedPlates.indexOf(lastIntCar);
    baseCarIndex = (lastIntCarIndex + 1) % sortedPlates.length;
  }
  
  // Alternate based on visit number
  const intCarIndex = (baseCarIndex + visitNumber - 1) % sortedPlates.length;
  
  return sortedPlates[intCarIndex];
}

function checkIfFirstWeekOfBiWeekCycleFromHistory(allCarPlates, allHistory, weekOffset = 0, customer = null) {
  const customerHistory = allHistory.filter(record => 
    allCarPlates.includes(record.CarPlate)
  ).sort((a, b) => {
    const parseCustomDate = (dateStr) => {
      if (!dateStr) return new Date(0);
      const months = {'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
                     'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11};
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = months[parts[1]];
        const year = parseInt(parts[2]);
        return new Date(year, month, day);
      }
      return new Date(dateStr);
    };
    
    return parseCustomDate(b.WashDate) - parseCustomDate(a.WashDate);
  });
  
  // Calculate target date for this week
  const today = new Date();
  const targetDate = new Date(today.getTime() + (weekOffset * 7 * 24 * 60 * 60 * 1000));
  
  // Check if we have enough history (at least 1 wash)
  if (customerHistory.length === 0) {
    return 'UNKNOWN';
  }
  
  const parseCustomDate = (dateStr) => {
    if (!dateStr) return new Date(0);
    const months = {'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
                   'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11};
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = months[parts[1]];
      const year = parseInt(parts[2]);
      return new Date(year, month, day);
    }
    return new Date(dateStr);
  };
  
  const lastWashDate = parseCustomDate(customerHistory[0].WashDate);
  const daysSinceLastWash = Math.floor((targetDate - lastWashDate) / (24 * 60 * 60 * 1000));
  
  // Check data quality for wash type determination
  if (daysSinceLastWash > 21) {
    return 'UNKNOWN';
  }
  
  // Calculate bi-weekly cycle based on actual wash dates
  const weeksSinceLastWash = Math.floor(daysSinceLastWash / 7);
  

  
  // Bi-weekly customers appear every week, but wash type depends on cycle
  // Simplified bi-weekly logic: just alternate based on last wash type
  const lastWashType = customerHistory[0].WashType || customerHistory[0].WashTypePerformed;
  
  if (!lastWashType) {
    return 'UNKNOWN';
  }
  
  // For bi-weekly customers: alternate EXT/INT every week
  const shouldBeInt = (lastWashType === 'EXT');
  
  return shouldBeInt;
}

function expandDayName(shortDay) {
  const dayMap = {
    'Sat': 'Saturday', 'Mon': 'Monday', 'Tue': 'Tuesday',
    'Wed': 'Wednesday', 'Thu': 'Thursday', 'Thurs': 'Thursday', 'Fri': 'Friday'
  };
  return dayMap[shortDay] || shortDay;
}

function parseDaysField(daysField) {
  if (!daysField) return [];
  return daysField.split('-').map(d => expandDayName(d.trim())).filter(day => day);
}

function getCompletedTasksForWeek(allHistory, weekOffset) {
  const today = new Date();
  const currentDay = today.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
  
  // Find the Monday of current work week (Monday is start of work week)
  let mondayOfWeek = new Date(today);
  if (currentDay === 0) { // Sunday - go to next Monday
    mondayOfWeek.setDate(today.getDate() + 1);
  } else if (currentDay === 1) { // Monday - start of work week
    // Already Monday
  } else { // Tuesday-Saturday (2-6) - go back to Monday of this work week
    mondayOfWeek.setDate(today.getDate() - currentDay + 1);
  }
  
  // Add week offset
  mondayOfWeek.setDate(mondayOfWeek.getDate() + (weekOffset * 7));
  mondayOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(mondayOfWeek);
  endOfWeek.setDate(mondayOfWeek.getDate() + 5); // Saturday + include Saturday
  endOfWeek.setHours(23, 59, 59, 999);
  
  // Filter for completed AND cancelled tasks (both should prevent auto-scheduling)
  const completedTasks = allHistory.filter(record => {
    const washDate = parseHistoryDate(record.WashDate);
    const isInRange = washDate >= mondayOfWeek && washDate <= endOfWeek;
    
    // Include both 'Completed' and 'Cancelled' status
    const isCompletedOrCancelled = record.Status === 'Completed' || record.Status === 'Cancelled';
    
    return isInRange && isCompletedOrCancelled;
  });
  
  return completedTasks;
}

function filterActiveCustomers(customers, completedTasks, weekOffset) {
  return customers.filter(customer => {
    if (!customer || (customer.Status !== 'Active' && customer.Status !== 'Booked')) return false;
    return true; // Include all active and booked customers - filtering by date only
  });
}

function addActualDatesToAppointments(appointments, weekOffset) {
  const today = new Date();
  const currentDay = today.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
  
  // Find the Monday of current work week (Monday is start of work week)
  let mondayOfWeek = new Date(today);
  if (currentDay === 0) { // Sunday - go to next Monday
    mondayOfWeek.setDate(today.getDate() + 1);
  } else if (currentDay === 1) { // Monday - start of work week
    // Already Monday
  } else { // Tuesday-Saturday (2-6) - go back to Monday of this work week
    mondayOfWeek.setDate(today.getDate() - currentDay + 1);
  }
  
  // Add week offset
  mondayOfWeek.setDate(mondayOfWeek.getDate() + (weekOffset * 7));
  mondayOfWeek.setHours(0, 0, 0, 0);
  
  const dayOffsets = {
    'Monday': 0,
    'Tuesday': 1,
    'Wednesday': 2,
    'Thursday': 3,
    'Friday': 4,
    'Saturday': 5
  };
  
  return appointments.map(appointment => {
    const dayOffset = dayOffsets[appointment.day];
    const appointmentDate = new Date(mondayOfWeek);
    appointmentDate.setDate(mondayOfWeek.getDate() + dayOffset);
    
    // Fix timezone issue - use local date components instead of ISO string
    const year = appointmentDate.getFullYear();
    const month = String(appointmentDate.getMonth() + 1).padStart(2, '0');
    const day = String(appointmentDate.getDate()).padStart(2, '0');
    const actualDateFixed = `${year}-${month}-${day}`;
    
    return {
      ...appointment,
      actualDate: actualDateFixed,
      displayDate: appointmentDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    };
  });
}

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

function parseCustomerStartDate(dateStr) {
  if (!dateStr) return new Date(0);
  
  // Handle DD-MMM-YY format (e.g., 10-Oct-25)
  const months = {'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
                 'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11};
  const parts = dateStr.split('-');
  if (parts.length === 3 && months[parts[1]] !== undefined) {
    const day = parseInt(parts[0]);
    const month = months[parts[1]];
    let year = parseInt(parts[2]);
    
    // Handle 2-digit year (25 = 2025)
    if (year < 100) {
      year += 2000;
    }
    
    const result = new Date(year, month, day);
    
    return result;
  }
  
  // Fallback to standard date parsing
  return new Date(dateStr);
}

function getCurrentWeekStart(weekOffset) {
  const today = new Date();
  const currentDay = today.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
  
  // Calculate days to subtract to get to Monday
  let daysToMonday;
  if (currentDay === 0) { // Sunday
    daysToMonday = 6; // Go back 6 days to get Monday
  } else {
    daysToMonday = currentDay - 1; // Go back to Monday
  }
  
  const mondayOfWeek = new Date(today);
  mondayOfWeek.setDate(today.getDate() - daysToMonday + (weekOffset * 7));
  mondayOfWeek.setHours(0, 0, 0, 0);
  
  return mondayOfWeek;
}

function getCurrentWeekEnd(weekOffset) {
  const weekStart = getCurrentWeekStart(weekOffset);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 5); // Saturday (Monday + 5 days)
  weekEnd.setHours(23, 59, 59, 999);
  
  return weekEnd;
}

function getAppointmentDate(dayName, weekOffset) {
  const weekStart = getCurrentWeekStart(weekOffset);
  const dayOffsets = {
    'Monday': 0,
    'Tuesday': 1,
    'Wednesday': 2,
    'Thursday': 3,
    'Friday': 4,
    'Saturday': 5
  };
  
  const appointmentDate = new Date(weekStart);
  appointmentDate.setDate(weekStart.getDate() + dayOffsets[dayName]);
  
  return appointmentDate;
}

function getDayFromDate(dateStr, weekOffset) {
  const date = parseHistoryDate(dateStr);
  const weekStart = getCurrentWeekStart(weekOffset);
  const weekEnd = getCurrentWeekEnd(weekOffset);
  
  // Check if date is within the current week
  if (date < weekStart || date > weekEnd) {
    return null; // Date is not in this week
  }
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayIndex = date.getDay();
  const dayName = dayNames[dayIndex];
  
  // Only return work days (Monday-Saturday)
  if (dayName === 'Sunday') {
    return null;
  }
  
  return dayName;
}

function getOriginalTimeFromHistory(completedTask) {
  // Try to extract original time from history record
  // This could be stored in a separate field or parsed from notes
  return completedTask.OriginalTime || completedTask.Time || '6:00 AM';
}

const deleteTask = async (req, res) => {
  try {
    // Get taskId from URL parameter or request body
    const taskId = req.params.customerId || req.body.taskId;
    
    if (!taskId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Task ID is required' 
      });
    }
    
    const existingTasks = await getScheduledTasks();
    
    console.log(`[DELETE-TASK] Attempting to delete: ${taskId}`);
    console.log(`[DELETE-TASK] Total tasks before deletion: ${existingTasks.length}`);
    
    // Find and remove the specific task
    const updatedTasks = existingTasks.filter(task => {
      if (taskId.startsWith('MANUAL_')) {
        // For manual appointments, match by CustomerID (including multi-car variants)
        const matches = task.CustomerID === taskId || task.CustomerID.startsWith(taskId.split('_CAR')[0]);
        if (matches) {
          console.log(`[DELETE-TASK] Found manual appointment to delete: ${task.CustomerID}`);
        }
        return !matches;
      } else {
        // For regular tasks, use the complex taskId format
        const currentTaskId = `${task.CustomerID}-${task.Day}-${task.Time}-${task.CarPlate || 'NOPLATE'}`;
        return currentTaskId !== taskId;
      }
    });
    
    console.log(`[DELETE-TASK] Total tasks after deletion: ${updatedTasks.length}`);
    
    if (updatedTasks.length === existingTasks.length) {
      return res.status(404).json({ 
        success: false, 
        error: 'Task not found' 
      });
    }
    
    // Save updated schedule
    const formattedTasks = updatedTasks.map(task => ({
      day: task.Day,
      appointmentDate: task.AppointmentDate || '',
      time: task.Time,
      customerId: task.CustomerID,
      customerName: task.CustomerName,
      villa: task.Villa,
      carPlate: task.CarPlate || '',
      washType: task.WashType || 'EXT',
      workerName: task.WorkerName,
      workerId: task.WorkerID,
      packageType: task.PackageType || '',
      isLocked: task.isLocked || 'FALSE',
      scheduleDate: task.ScheduleDate || new Date().toISOString().split('T')[0]
    }));
    
    await clearAndWriteSheet('ScheduledTasks', formattedTasks);
    clearScheduleCache();
    
    console.log(`[DELETE-TASK] Successfully deleted task: ${taskId}`);
    
    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
    
  } catch (error) {
    console.error('[DELETE-TASK] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const syncNewCustomers = async (req, res) => {
  try {
    const { weekOffset = 0 } = req.body;
    
    // Get existing schedule
    const existingTasks = await getScheduledTasks();
    const existingCustomerIds = new Set(existingTasks.map(task => task.CustomerID));
    
    console.log(`[SYNC-NEW] Existing customer IDs in schedule: ${Array.from(existingCustomerIds).join(', ')}`);
    
    // Get all customers from database
    const [customers, workers, allHistory] = await Promise.all([
      getCustomers(),
      getWorkers(),
      getAllHistory()
    ]);
    
    console.log(`[SYNC-NEW] Total customers in database: ${customers.length}`);
    const activeCustomers = customers.filter(customer => customer.Status === 'Active' || customer.Status === 'Booked');
    console.log(`[SYNC-NEW] Active/Booked customers: ${activeCustomers.length}`);
    console.log(`[SYNC-NEW] Active customer IDs: ${activeCustomers.map(c => c.CustomerID).join(', ')}`);
    
    // Check specifically for CUST-047
    const cust047 = customers.find(c => c.CustomerID === 'CUST-047');
    if (cust047) {
      console.log(`[SYNC-NEW] CUST-047 found in database:`, {
        CustomerID: cust047.CustomerID,
        Name: cust047.Name,
        Status: cust047.Status,
        Days: cust047.Days,
        Time: cust047.Time,
        CarPlates: cust047.CarPlates,
        Washman_Package: cust047.Washman_Package
      });
      
      // Test appointment generation for CUST-047
      console.log(`[SYNC-NEW] Testing appointment generation for CUST-047...`);
      const testAppointments = await generateAllAppointments([cust047], allHistory, weekOffset, false);
      const testCount = testAppointments.appointments ? testAppointments.appointments.length : testAppointments.length;
      console.log(`[SYNC-NEW] CUST-047 should generate ${testCount} appointments`);
      if (testCount > 0) {
        const appointments = testAppointments.appointments || testAppointments;
        console.log(`[SYNC-NEW] CUST-047 appointments:`, appointments.map(apt => ({
          day: apt.day,
          time: apt.time,
          carPlate: apt.carPlate,
          washType: apt.washType
        })));
      }
    } else {
      console.log(`[SYNC-NEW] CUST-047 NOT FOUND in database!`);
    }
    
    // Find new customers not in existing schedule OR customers with incomplete appointments
    const newCustomers = [];
    
    for (const customer of activeCustomers) {
      if (customer.CustomerID === 'CUST-047') {
        console.log(`[SYNC-NEW] Processing CUST-047:`);
        console.log(`[SYNC-NEW] - Is in existing schedule: ${existingCustomerIds.has(customer.CustomerID)}`);
        
        if (!existingCustomerIds.has(customer.CustomerID)) {
          console.log(`[SYNC-NEW] - CUST-047 is completely new, adding to newCustomers`);
        } else {
          const customerTasks = existingTasks.filter(task => task.CustomerID === customer.CustomerID);
          console.log(`[SYNC-NEW] - CUST-047 existing tasks: ${customerTasks.length}`);
          
          const expectedAppointments = await generateAllAppointments([customer], allHistory, weekOffset, false);
          const expectedCount = expectedAppointments.appointments ? expectedAppointments.appointments.length : expectedAppointments.length;
          console.log(`[SYNC-NEW] - CUST-047 expected appointments: ${expectedCount}`);
          
          if (customerTasks.length < expectedCount) {
            console.log(`[SYNC-NEW] - CUST-047 has incomplete appointments, adding to newCustomers`);
          } else {
            console.log(`[SYNC-NEW] - CUST-047 has complete appointments, skipping`);
          }
        }
      }
      
      if (!existingCustomerIds.has(customer.CustomerID)) {
        // Completely new customer
        newCustomers.push(customer);
        console.log(`[SYNC-NEW] Found new customer: ${customer.CustomerID}`);
      } else {
        // Check if customer has incomplete appointments (missing some days/times)
        const customerTasks = existingTasks.filter(task => task.CustomerID === customer.CustomerID);
        const expectedAppointments = await generateAllAppointments([customer], allHistory, weekOffset, false);
        const expectedCount = expectedAppointments.appointments ? expectedAppointments.appointments.length : expectedAppointments.length;
        
        if (customerTasks.length < expectedCount) {
          console.log(`[SYNC-NEW] Customer ${customer.CustomerID} has incomplete appointments: ${customerTasks.length}/${expectedCount}`);
          newCustomers.push(customer);
        }
      }
    }
    
    console.log(`[SYNC-NEW] New customers found: ${newCustomers.length}`);
    if (newCustomers.length > 0) {
      console.log(`[SYNC-NEW] New customer IDs: ${newCustomers.map(c => c.CustomerID).join(', ')}`);
      console.log(`[SYNC-NEW] New customers details:`, newCustomers.map(c => ({ id: c.CustomerID, name: c.Name, villa: c.Villa, status: c.Status })));
    } else {
      console.log(`[SYNC-NEW] No new customers found. All active customers are already in schedule.`);
      // Show which customers are already in schedule
      const activeCustomerIds = activeCustomers.map(c => c.CustomerID);
      const alreadyInSchedule = activeCustomerIds.filter(id => existingCustomerIds.has(id));
      console.log(`[SYNC-NEW] Active customers already in schedule: ${alreadyInSchedule.join(', ')}`);
    }
    
    if (newCustomers.length === 0) {
      return res.json({
        success: true,
        message: 'No new customers found',
        newCustomersCount: 0,
        newCustomers: [],
        assignments: existingTasks.map(formatExistingTask)
      });
    }
    
    // Generate appointments for new customers only
    const newAppointmentsResult = await generateAllAppointments(newCustomers, allHistory, weekOffset, false);
    const newAppointments = newAppointmentsResult.appointments || newAppointmentsResult;
    
    // Add dates to new appointments
    const newAppointmentsWithDates = addActualDatesToAppointments(newAppointments, weekOffset);
    
    // Assign workers to new appointments
    const activeWorkers = workers.filter(worker => worker.Status === 'Active');
    const assignedNewTasks = assignWorkersToTasks(newAppointmentsWithDates, activeWorkers, existingTasks);
    
    // Combine existing and new tasks
    const combinedTasks = [
      ...existingTasks.map(formatExistingTask),
      ...assignedNewTasks
    ];
    
    // Save updated schedule
    const scheduleForSaving = combinedTasks.map(task => ({
      day: task.day,
      appointmentDate: task.appointmentDate || '',
      time: task.time,
      customerId: task.customerId,
      customerName: task.customerName,
      villa: task.villa,
      carPlate: task.carPlate || '',
      washType: task.washType || 'EXT',
      workerName: task.workerName || '',
      workerId: task.workerId || '',
      packageType: task.packageType || '',
      isLocked: task.isLocked || 'FALSE',
      scheduleDate: task.scheduleDate || new Date().toISOString().split('T')[0],
      customerStatus: task.customerStatus || 'Active'
    }));
    
  // Validate combined schedule before saving when syncing new customers
  const validatedCombined = validateAndFixSchedule(scheduleForSaving);
  await clearAndWriteSheet('ScheduledTasks', validatedCombined);
    clearScheduleCache();
    
    // Count actual new customers added (from original newCustomers list)
    const actualNewCustomersAdded = newCustomers.length;
    
    res.json({
      success: true,
      message: `Successfully added ${actualNewCustomersAdded} new customers`,
      newCustomersCount: actualNewCustomersAdded,
      newCustomers: newCustomers.map(c => ({ CustomerID: c.CustomerID, Name: c.Name, Villa: c.Villa })),
      totalAppointments: combinedTasks.length,
      assignments: combinedTasks
    });
    
  } catch (error) {
    console.error('[SYNC-NEW] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

function formatExistingTask(task) {
  return {
    day: task.Day,
    appointmentDate: task.AppointmentDate || '',
    time: task.Time,
    customerId: task.CustomerID,
    customerName: task.CustomerName,
    villa: task.Villa,
    carPlate: task.CarPlate || '',
    washType: task.WashType || 'EXT',
    workerName: task.WorkerName,
    workerId: task.WorkerID,
    packageType: task.PackageType || '',
    isLocked: task.isLocked || 'FALSE',
    scheduleDate: task.ScheduleDate || new Date().toISOString().split('T')[0],
    customerStatus: task.customerStatus || 'Active',
    status: task.Status,
    originalWashType: task.OriginalWashType
  };
}

const batchUpdateTasks = async (req, res) => {
  try {
    const { changes } = req.body;
    
    if (!changes || !Array.isArray(changes) || changes.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Changes array is required and must not be empty' 
      });
    }
    
    const existingTasks = await getScheduledTasks();
    let updatedTasks = [...existingTasks];
    let processedChanges = 0;
    
    // Process each change
    for (const change of changes) {
      const { type, taskId, newWashType, newWorkerName, sourceDay, sourceTime, targetDay, targetTime, isSlotSwap } = change;
      
      if (type === 'washType') {
        // Handle wash type change
        const taskIdParts = taskId.split('-');
        const customerId = `${taskIdParts[0]}-${taskIdParts[1]}`;
        const day = taskIdParts[2];
        const carPlate = taskIdParts.slice(4).join('-') || '';
        
        const taskIndex = updatedTasks.findIndex(task => 
          (task.CustomerID || task.customerId) === customerId &&
          (task.Day || task.day) === day &&
          ((task.CarPlate || task.carPlate) || 'NOPLATE') === (carPlate === 'NOPLATE' ? '' : carPlate)
        );
        
        if (taskIndex !== -1) {
          if (updatedTasks[taskIndex].WashType !== undefined) {
            updatedTasks[taskIndex].WashType = newWashType;
            updatedTasks[taskIndex].isLocked = 'TRUE';
          } else {
            updatedTasks[taskIndex].washType = newWashType;
            updatedTasks[taskIndex].isLocked = 'TRUE';
          }
          processedChanges++;
        }
      } 
      else if (type === 'dragDrop') {
        // Handle drag and drop change
        const workers = await getWorkers();
        const newWorker = workers.find(w => w.Name === newWorkerName && w.Status === 'Active');
        
        if (!newWorker) {
          continue;
        }
        
        const taskIdParts = taskId.split('-');
        const customerId = `${taskIdParts[0]}-${taskIdParts[1]}`;
        
        if (isSlotSwap && sourceDay && sourceTime && targetDay && targetTime) {
          // Handle slot swap
          const sourceWorkerName = updatedTasks.find(t => 
            (t.CustomerID || t.customerId) === customerId &&
            (t.Day || t.day) === sourceDay &&
            (t.Time || t.time) === sourceTime
          )?.WorkerName || updatedTasks.find(t => 
            (t.CustomerID || t.customerId) === customerId &&
            (t.Day || t.day) === sourceDay &&
            (t.Time || t.time) === sourceTime
          )?.workerName;
          
          const sourceWorker = workers.find(w => w.Name === sourceWorkerName);
          
          updatedTasks.forEach(task => {
            const taskWorkerName = task.WorkerName || task.workerName;
            const taskDay = task.Day || task.day;
            const taskTime = task.Time || task.time;
            
            // Swap source slot tasks to target worker
            if (taskWorkerName === sourceWorkerName && 
                taskDay === sourceDay && 
                taskTime === sourceTime) {
              if (task.WorkerName !== undefined) {
                task.WorkerName = newWorkerName;
                task.WorkerID = newWorker.WorkerID;
                task.isLocked = 'TRUE';
              } else {
                task.workerName = newWorkerName;
                task.workerId = newWorker.WorkerID;
                task.isLocked = 'TRUE';
              }
            }
            // Swap target slot tasks to source worker
            else if (taskWorkerName === newWorkerName && 
                     taskDay === targetDay && 
                     taskTime === targetTime) {
              if (task.WorkerName !== undefined) {
                task.WorkerName = sourceWorkerName;
                task.WorkerID = sourceWorker?.WorkerID || '';
                task.isLocked = 'TRUE';
              } else {
                task.workerName = sourceWorkerName;
                task.workerId = sourceWorker?.WorkerID || '';
                task.isLocked = 'TRUE';
              }
            }
          });
        } else {
          // Handle simple drag and drop
          const sourceDay = change.sourceDay || taskIdParts[2];
          const sourceTime = change.sourceTime || taskIdParts[3];
          const targetDay = change.targetDay || sourceDay;
          const targetTime = change.targetTime || sourceTime;
          
          console.log(`[BATCH-UPDATE] Moving ${customerId} from ${sourceDay} ${sourceTime} to ${targetDay} ${targetTime}`);
          
          // Remove old tasks from source location
          const tasksToMove = updatedTasks.filter(task => 
            (task.CustomerID || task.customerId) === customerId &&
            (task.Day || task.day) === sourceDay &&
            (task.Time || task.time) === sourceTime
          );
          
          // Remove old tasks
          updatedTasks = updatedTasks.filter(task => {
            const isTaskToMove = (task.CustomerID || task.customerId) === customerId &&
                                (task.Day || task.day) === sourceDay &&
                                (task.Time || task.time) === sourceTime;
            return !isTaskToMove;
          });
          
          // Create new tasks at target location
          const newTasks = tasksToMove.map(oldTask => {
            if (oldTask.WorkerName !== undefined) {
              return {
                ...oldTask,
                WorkerName: newWorkerName,
                WorkerID: newWorker.WorkerID,
                Day: targetDay,
                Time: targetTime,
                isLocked: 'TRUE'
              };
            } else {
              return {
                ...oldTask,
                workerName: newWorkerName,
                workerId: newWorker.WorkerID,
                day: targetDay,
                time: targetTime,
                isLocked: 'TRUE'
              };
            }
          });
          
          // Add new tasks
          updatedTasks.push(...newTasks);
          
          console.log(`[BATCH-UPDATE] Moved ${tasksToMove.length} tasks from ${sourceDay} ${sourceTime} to ${targetDay} ${targetTime}`);
        }
        processedChanges++;
      }
    }
    
    // Remove duplicates before saving
    const uniqueTasks = [];
    const seenKeys = new Set();
    updatedTasks.forEach(task => {
      const key = `${task.CustomerID || task.customerId}-${task.Day || task.day}-${task.Time || task.time}-${(task.CarPlate || task.carPlate) || 'NOPLATE'}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        uniqueTasks.push(task);
      }
    });
    
    // Save all changes to Google Sheets
    const formattedTasks = uniqueTasks.map(task => ({
      day: task.Day || task.day,
      appointmentDate: task.AppointmentDate || task.appointmentDate || '',
      time: task.Time || task.time,
      customerId: task.CustomerID || task.customerId,
      customerName: task.CustomerName || task.customerName,
      villa: task.Villa || task.villa,
      carPlate: (task.CarPlate || task.carPlate) || '',
      washType: (task.WashType || task.washType) || 'EXT',
      workerName: (task.WorkerName || task.workerName) || '',
      workerId: (task.WorkerID || task.workerId) || '',
      packageType: (task.PackageType || task.packageType) || '',
      isLocked: task.isLocked || 'FALSE',
      scheduleDate: (task.ScheduleDate || task.scheduleDate) || new Date().toISOString().split('T')[0],
      customerStatus: task.customerStatus || 'Active'
    }));
    
    console.log(`[BATCH-UPDATE] Removed ${updatedTasks.length - uniqueTasks.length} duplicate tasks before saving`);
    
    await clearAndWriteSheet('ScheduledTasks', formattedTasks);
    
    // Clear cache after update
    clearScheduleCache();
    
    // Add small delay to ensure Google Sheets is updated
    await new Promise(resolve => setTimeout(resolve, 500));
    
    res.json({
      success: true,
      message: `Successfully processed ${processedChanges} changes and saved to server`,
      processedChanges
    });
    
  } catch (error) {
    console.error('[BATCH-UPDATE] Error:', error);
    res.status(500).json({ success: false, error: error.message, stack: error.stack });
  }
};

const getWashHistory = async (req, res) => {
  try {
    const { customerId } = req.params;
    const limit = parseInt(req.query.limit) || 6;
    
    console.log('Fetching wash history for:', customerId);
    
    if (!customerId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Customer ID is required' 
      });
    }
    
    const allHistory = await getAllHistory();
    
    // Filter history for this customer and sort by date (newest first)
    const customerHistory = allHistory
      .filter(record => record.CustomerID === customerId)
      .sort((a, b) => {
        const parseDate = (dateStr) => {
          if (!dateStr) return new Date(0);
          const months = {'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
                         'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11};
          const parts = dateStr.split('-');
          if (parts.length === 3) {
            const day = parseInt(parts[0]);
            const month = months[parts[1]];
            const year = parseInt(parts[2]);
            return new Date(year, month, day);
          }
          return new Date(dateStr);
        };
        return parseDate(b.WashDate) - parseDate(a.WashDate);
      })
      .slice(0, limit)
      .map(record => ({
        washDate: record.WashDate,
        carPlate: record.CarPlate,
        washType: record.WashTypePerformed || record.WashType || 'EXT',
        status: record.Status
      }));
    
    console.log('Found wash history records:', customerHistory.length);
    
    res.json({
      success: true,
      history: customerHistory
    });
    
  } catch (error) {
    console.error('[WASH-HISTORY] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { 
  autoAssignSchedule, 
  getSchedule,
  addManualAppointment,
  getAvailableWorkers,
  updateTaskAssignment,
  deleteTask,
  batchUpdateTasks,
  syncNewCustomers,
  getWashHistory,
  clearScheduleCache
};
// Export validator for external use (dry-run validation)
module.exports.validateAndFixSchedule = validateAndFixSchedule;