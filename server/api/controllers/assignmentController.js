const { getCustomers, getWorkers, getAllHistory, getScheduledTasks, clearAndWriteSheet, addRowToSheet } = require('../../services/googleSheetsService');
const { determineIntCarForCustomer, checkIfFirstWeekOfBiWeekCycle } = require('../../services/logicService');

const autoAssignSchedule = async (req, res) => {
  const weekOffset = parseInt(req.params.weekOffset) || 0;
  
  const today = new Date();
  console.log(`\n🚀 [SCHEDULE DEBUG] Starting schedule generation for weekOffset: ${weekOffset}`);
  console.log(`📅 ${weekOffset === 0 ? 'CURRENT WEEK' : weekOffset > 0 ? `WEEK +${weekOffset} (FUTURE)` : `WEEK ${weekOffset} (PAST)`}`);
  console.log(`📅 TODAY: ${today.toDateString()}`);
  
  try {
    // 1. Fetch All Data
    const [customers, workers, allHistory, existingSchedule] = await Promise.all([
      getCustomers(),
      getWorkers(),
      getAllHistory(),
      getScheduledTasks()
    ]);
    
    const activeWorkers = workers.filter(worker => worker.Status === 'Active');
    
    if (activeWorkers.length === 0) {
      return res.status(400).json({ success: false, error: 'No active workers found.' });
    }
    
    // 2. Identify Locked Tasks
    const lockedTasks = existingSchedule.filter(task => task.isLocked === 'TRUE');
    

    
    // 3. Generate All Potential New Appointments
    console.log(`📊 Generating appointments for ${customers.length} customers...`);
    const potentialAppointments = generateAllAppointments(customers, allHistory, weekOffset);
    console.log(`📝 Generated ${potentialAppointments.length} potential appointments`);
    

    
    // 4. Filter Out Appointments Already Covered by Locked Tasks
    const unlockedAppointments = filterUnlockedAppointments(potentialAppointments, lockedTasks);
    

    
    // 5. Assign Workers to Unlocked Tasks (Respecting Locked Worker Schedules)
    const assignedUnlockedTasks = assignWorkersToTasks(unlockedAppointments, activeWorkers, lockedTasks);
    

    
    // 6. Combine Locked and Newly Assigned Tasks
    const combinedSchedule = [...lockedTasks.map(formatLockedTask), ...assignedUnlockedTasks];
    
    // 7. Remove Duplicates
    const finalSchedule = [];
    const seen = new Set();
    combinedSchedule.forEach(task => {
      const key = `${task.customerId}-${task.day}-${task.time}-${task.carPlate || 'NOPLATE'}`;
      if (!seen.has(key)) {
        seen.add(key);
        finalSchedule.push(task);
      }
    });
    

    
    // 8. Save Complete Schedule
    await clearAndWriteSheet('ScheduledTasks', finalSchedule);
    
    const endTime = new Date();
    console.log(`✅ Schedule generation completed at: ${endTime.toTimeString().split(' ')[0]}`);
    console.log(`📊 Final stats: ${finalSchedule.length} total appointments, ${lockedTasks.length} locked, ${assignedUnlockedTasks.length} new\n`);
    
    res.json({
      success: true,
      message: 'Smart schedule generated successfully with locked tasks preserved.',
      totalAppointments: finalSchedule.length,
      lockedTasks: lockedTasks.length,
      newAssignments: assignedUnlockedTasks.length,
      assignments: finalSchedule
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

function generateAllAppointments(customers, allHistory, weekOffset) {
  const appointments = [];
  const days = ['Saturday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = ['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'];
  
  customers.forEach(customer => {
    if (!customer || customer.Status !== 'Active' || !customer.CustomerID) return;
    
    const timeField = customer.Time || '';
    const daysField = customer.Days || '';
    const notesField = customer.Notes || '';
    const carPlates = (customer.CarPlates || '').split(',').map(p => p.trim()).filter(p => p);
    if (carPlates.length === 0) carPlates.push('');
    
    // For multi-car customers, track visit counter for alternating INT
    let visitCounter = 0;
    
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
    
    // Generate appointments from day@time format in Time field
    if (dayTimeMatches.length > 0) {
      dayTimeMatches.forEach((dayTime, index) => {
        if (days.includes(dayTime.day) && timeSlots.includes(dayTime.time)) {
          // For multi-car customers, determine which car gets INT for this visit
          let intCarForThisVisit = null;
          if (carPlates.length > 1) {
            visitCounter++;
            intCarForThisVisit = determineIntCarForCustomer(carPlates, allHistory, visitCounter - 1, weekOffset);
          }
          
          carPlates.forEach(carPlate => {
            const visitNumber = index + 1;
            appointments.push({
              day: dayTime.day,
              time: dayTime.time,
              customerId: customer.CustomerID,
              customerName: customer.Name,
              villa: customer.Villa,
              carPlate,
              washType: calculateHistoryBasedWashType(customer, carPlate, allHistory, visitNumber, weekOffset, intCarForThisVisit),
              packageType: customer.Washman_Package || ''
            });
          });
        }
      });
    }
    // Generate regular appointments (only if no day@time format found)
    else if (daysField && timeField) {
      const times = timeField.includes('&') ? timeField.split('&').map(t => t.trim()) : [timeField.trim()];
      
      customerDays.forEach((day, dayIndex) => {
        if (days.includes(day)) {
          const hasSpecificOverride = specificDays.includes(day);
          
          if (!hasSpecificOverride) {
            times.forEach(time => {
              if (timeSlots.includes(time)) {
                // For multi-car customers, determine which car gets INT for this visit
                let intCarForThisVisit = null;
                if (carPlates.length > 1) {
                  visitCounter++;
                  intCarForThisVisit = determineIntCarForCustomer(carPlates, allHistory, visitCounter - 1, weekOffset);
                }
                
                carPlates.forEach(carPlate => {
                  const visitNumber = dayIndex + 1;
                  appointments.push({
                    day,
                    time,
                    customerId: customer.CustomerID,
                    customerName: customer.Name,
                    villa: customer.Villa,
                    carPlate,
                    washType: calculateHistoryBasedWashType(customer, carPlate, allHistory, visitNumber, weekOffset, intCarForThisVisit),
                    packageType: customer.Washman_Package || ''
                  });
                });
              }
            });
          }
        }
      });
    }
    
    // Add specific appointments from Notes
    specificMatches.forEach((appointment, index) => {
      if (days.includes(appointment.day) && timeSlots.includes(appointment.time)) {
        // For multi-car customers, determine which car gets INT for this visit
        let intCarForThisVisit = null;
        if (carPlates.length > 1) {
          visitCounter++;
          intCarForThisVisit = determineIntCarForCustomer(carPlates, allHistory, visitCounter - 1, weekOffset);
        }
        
        carPlates.forEach(carPlate => {
          const visitNumber = index + 1;
          appointments.push({
            day: appointment.day,
            time: appointment.time,
            customerId: customer.CustomerID,
            customerName: customer.Name,
            villa: customer.Villa,
            carPlate,
            washType: calculateHistoryBasedWashType(customer, carPlate, allHistory, visitNumber, weekOffset, intCarForThisVisit),
            packageType: customer.Washman_Package || ''
          });
        });
      }
    });
  });
  
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
  
  return uniqueAppointments;
}

function filterUnlockedAppointments(potentialAppointments, lockedTasks) {
  return potentialAppointments.filter(appointment => {
    // Check if this appointment is already covered by a locked task
    const isLocked = lockedTasks.some(lockedTask => 
      lockedTask.CustomerID === appointment.customerId &&
      lockedTask.Day === appointment.day &&
      lockedTask.Time === appointment.time &&
      lockedTask.CarPlate === appointment.carPlate
    );
    return !isLocked;
  });
}

function assignWorkersToTasks(unlockedAppointments, activeWorkers, lockedTasks) {
  const days = ['Saturday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
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
  
  sortedTimeSlots.forEach(timeSlotKey => {
    const tasks = timeSlotGroups[timeSlotKey];
    const [day, time] = timeSlotKey.split('-');
    
    // Get workers busy with locked tasks at this time slot
    const busyWorkersFromLocked = lockedTasks
      .filter(task => task.Day === day && task.Time === time)
      .map(task => task.WorkerID);
    
    const workerVillaMap = {}; // villa -> worker mapping for this time slot
    
    tasks.forEach(task => {
      let assigned = false;
      
      // First, check if there's already a worker at this villa
      if (workerVillaMap[task.villa]) {
        const assignedWorker = workerVillaMap[task.villa];
        task.workerName = assignedWorker.Name;
        task.workerId = assignedWorker.WorkerID;
        task.isLocked = 'FALSE';
        assigned = true;
      } else {
        // Find next available worker (not busy with locked tasks or other assignments)
        const busyWorkers = [...busyWorkersFromLocked, ...Object.values(workerVillaMap).map(w => w.WorkerID)];
        const availableWorker = activeWorkers.find(w => !busyWorkers.includes(w.WorkerID));
        
        if (availableWorker) {
          task.workerName = availableWorker.Name;
          task.workerId = availableWorker.WorkerID;
          task.isLocked = 'FALSE';
          workerVillaMap[task.villa] = availableWorker;
          assigned = true;
        }
      }
      
      if (assigned) {
        task.scheduleDate = new Date().toISOString().split('T')[0];
        task.isBiWeekly = task.packageType?.includes('bi week') || false;
        assignedTasks.push(task);
      }
    });
  });
  
  return assignedTasks;
}

function formatLockedTask(lockedTask) {
  return {
    day: lockedTask.Day,
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
    isBiWeekly: lockedTask.PackageType?.includes('bi week') || false
  };
}

// Keep existing functions for other endpoints
const getSchedule = async (req, res) => {
  try {
    const scheduledTasks = await getScheduledTasks();
    
    const assignments = scheduledTasks.map(task => ({
      day: task.Day,
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
    
    res.json({
      success: true,
      message: 'Schedule loaded successfully',
      totalAppointments: assignments.length,
      assignments
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
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
    const { villa, day, time, workerName, washType, carPlate } = req.body;
    
    if (!villa || !day || !time || !workerName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: villa, day, time, workerName' 
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
    
    const workerConflict = existingTasks.find(task => 
      task.WorkerName === workerName && 
      task.Day === day && 
      task.Time === time
    );
    
    if (workerConflict) {
      return res.status(400).json({ 
        success: false, 
        error: `Worker ${workerName} is already assigned at ${day} ${time}` 
      });
    }
    
    const newAppointment = {
      day,
      time,
      customerId: `MANUAL_${Date.now()}`,
      customerName: villa,
      villa,
      carPlate: carPlate || '',
      washType: washType || 'EXT',
      workerName,
      workerId: worker.WorkerID,
      isLocked: 'TRUE',
      scheduleDate: new Date().toISOString().split('T')[0]
    };
    
    await addRowToSheet('ScheduledTasks', [newAppointment]);
    
    res.json({
      success: true,
      message: 'Manual appointment added and locked successfully',
      appointment: newAppointment
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateTaskAssignment = async (req, res) => {
  try {
    const { taskId, newWorkerName, newWashType, isSlotSwap, sourceDay, sourceTime, targetDay, targetTime } = req.body;
    
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
      const sourceWorkerName = existingTasks.find(t => 
        `${t.CustomerID}-${t.Day}-${t.Time}-${t.CarPlate}` === taskId
      )?.WorkerName;
      
      const sourceWorker = workers.find(w => w.Name === sourceWorkerName);
      
      // Get all tasks in source slot
      const sourceSlotTasks = existingTasks.filter(task => 
        task.WorkerName === sourceWorkerName && 
        task.Day === sourceDay && 
        task.Time === sourceTime
      );
      
      // Get all tasks in target slot
      const targetSlotTasks = existingTasks.filter(task => 
        task.WorkerName === newWorkerName && 
        task.Day === targetDay && 
        task.Time === targetTime
      );
      
      // Swap all tasks in source slot to target worker
      sourceSlotTasks.forEach(task => {
        task.WorkerName = newWorkerName;
        task.WorkerID = newWorker.WorkerID;
        task.isLocked = 'TRUE';
      });
      
      // Swap all tasks in target slot to source worker
      targetSlotTasks.forEach(task => {
        task.WorkerName = sourceWorkerName;
        task.WorkerID = sourceWorker?.WorkerID;
        task.isLocked = 'TRUE';
      });
      
    } else {
      // Handle single task update
      const taskIndex = existingTasks.findIndex(task => 
        `${task.CustomerID}-${task.Day}-${task.Time}-${task.CarPlate}` === taskId
      );
      
      if (taskIndex === -1) {
        return res.status(404).json({ 
          success: false, 
          error: 'Task not found' 
        });
      }
      
      const task = existingTasks[taskIndex];
      
      // Check for conflicts
      const workerConflict = existingTasks.find((t, index) => 
        index !== taskIndex &&
        t.WorkerName === newWorkerName && 
        t.Day === task.Day && 
        t.Time === task.Time
      );
      
      if (workerConflict) {
        return res.status(400).json({ 
          success: false, 
          error: `Worker ${newWorkerName} is already assigned at ${task.Day} ${task.Time}` 
        });
      }
      
      // Update task and lock it
      existingTasks[taskIndex].WorkerName = newWorkerName;
      existingTasks[taskIndex].WorkerID = newWorker.WorkerID;
      existingTasks[taskIndex].isLocked = 'TRUE';
      
      if (newWashType) {
        existingTasks[taskIndex].WashType = newWashType;
      }
    }
    
    // Save updated schedule - remove duplicates first
    const uniqueTasks = [];
    const seen = new Set();
    existingTasks.forEach(task => {
      const key = `${task.CustomerID}-${task.Day}-${task.Time}-${task.CarPlate || 'NOPLATE'}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueTasks.push(task);
      }
    });
    
    const updatedSchedule = uniqueTasks.map(task => ({
      day: task.Day,
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
    
    await clearAndWriteSheet('ScheduledTasks', updatedSchedule);
    

    
    res.json({
      success: true,
      message: 'Task updated and locked successfully'
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Helper functions
function calculateHistoryBasedWashType(customer, carPlate, allHistory, visitNumber, weekOffset = 0, intCarForThisVisit = null) {
  const packageName = customer.Washman_Package || '';
  const carPlates = (customer.CarPlates || '').split(',').map(p => p.trim()).filter(p => p);
  
  console.log(`[WASH-TYPE] ${customer.Name} - ${carPlate} - Package: ${packageName} - Visit: ${visitNumber}`);
  
  // Rule 1: 'Ext Only' packages are always EXT
  if (packageName.toLowerCase().includes('ext only')) {
    console.log(`[EXT-ONLY] ${customer.Name} - ${carPlate}: EXT (Ext Only package)`);
    return 'EXT';
  }
  
  let washType = 'EXT';
  
  // Rule 2: Single car customers - INT based on package type
  if (carPlates.length === 1) {
    if (packageName.toLowerCase().includes('2 ext 1 int')) {
      // 2 EXT 1 INT: EXT, INT, EXT
      washType = (visitNumber === 2) ? 'INT' : 'EXT';
      console.log(`[2EXT1INT] ${customer.Name} - Visit ${visitNumber}: ${washType}`);
    }
    else if (packageName.toLowerCase().includes('3 ext 1 int')) {
      // 3 EXT 1 INT: EXT, INT, EXT, EXT
      washType = (visitNumber === 2) ? 'INT' : 'EXT';
      console.log(`[3EXT1INT] ${customer.Name} - Visit ${visitNumber}: ${washType}`);
    }
    else {
      console.log(`[DEFAULT] ${customer.Name} - Visit ${visitNumber}: EXT (Unknown package)`);
    }
  } else {
    // Rule 3: Multi-car customers - alternate INT between cars per visit
    washType = (carPlate === intCarForThisVisit) ? 'INT' : 'EXT';
    
    // Apply package-specific rules for multi-car customers
    if (packageName.toLowerCase().includes('2 ext 1 int')) {
      // For 2 EXT 1 INT: Only visits 1 & 2 can have INT, visit 3 is all EXT
      if (visitNumber >= 3) {
        washType = 'EXT';
      }
    }
    else if (packageName.toLowerCase().includes('3 ext 1 int')) {
      // For 3 EXT 1 INT: Only visits 1 & 2 can have INT, visits 3 & 4 are all EXT
      if (visitNumber >= 3) {
        washType = 'EXT';
      }
    }
    
    console.log(`[MULTI-CAR] ${customer.Name} - Visit ${visitNumber} - ${carPlate}: ${washType} (INT car: ${intCarForThisVisit})`);
  }
  
  // Rule 4: For bi-week packages, INT only applies on first week of cycle
  if (packageName.toLowerCase().includes('bi week') && washType === 'INT') {
    const isFirstWeek = checkIfFirstWeekOfBiWeekCycleFromHistory(carPlates, allHistory, weekOffset);
    console.log(`[BI-WEEK] ${customer.Name} - ${carPlate}: isFirstWeek = ${isFirstWeek}`);
    if (!isFirstWeek) {
      console.log(`[BI-WEEK] ${customer.Name} - ${carPlate}: Converting INT to EXT (second week)`);
      return 'EXT';
    }
  }
  
  return washType;
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
  
  console.log(`[MULTI-CAR] Visit ${visitNumber}: Base car index: ${baseCarIndex}, INT car: ${sortedPlates[intCarIndex]}`);
  
  return sortedPlates[intCarIndex];
}

function checkIfFirstWeekOfBiWeekCycleFromHistory(allCarPlates, allHistory, weekOffset = 0) {
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
  
  if (customerHistory.length === 0) {
    // No history: week 0 = first week, week 1 = second week, week 2 = first week again
    const isFirstWeek = (weekOffset % 2) === 0;
    console.log(`[BI-WEEK] No history - Week ${weekOffset}: ${isFirstWeek ? 'First week (INT)' : 'Second week (EXT)'}`);
    return isFirstWeek;
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
  const currentDate = new Date();
  // Add weekOffset to current date for future/past weeks
  const targetDate = new Date(currentDate.getTime() + (weekOffset * 7 * 24 * 60 * 60 * 1000));
  const daysDiff = Math.floor((targetDate - lastWashDate) / (1000 * 60 * 60 * 1000));
  
  console.log(`[BI-WEEK] Last wash: ${lastWashDate.toDateString()}, Target date: ${targetDate.toDateString()}, Days diff: ${daysDiff}`);
  
  // Bi-weekly cycle: 14 days = 2 weeks
  // Calculate which week of the bi-weekly cycle we're in
  const weeksSinceLastWash = Math.floor(daysDiff / 7);
  const isFirstWeek = (weeksSinceLastWash % 2) === 0;
  
  console.log(`[BI-WEEK] Weeks since last wash: ${weeksSinceLastWash}, Is first week (INT time): ${isFirstWeek}`);
  
  return isFirstWeek;
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

module.exports = { 
  autoAssignSchedule, 
  getSchedule,
  addManualAppointment,
  getAvailableWorkers,
  updateTaskAssignment
};