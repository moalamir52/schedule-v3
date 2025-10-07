const { getCustomers, getWorkers, getAllHistory, getScheduledTasks, clearAndWriteSheet, addRowToSheet } = require('../../services/googleSheetsService');

const autoAssignSchedule = async (req, res) => {
  const weekOffset = parseInt(req.params.weekOffset) || 0;
  
  const systemDate = new Date();
  const correctedToday = new Date('2025-10-07');
  console.log(`\n🚀 [SCHEDULE DEBUG] Starting schedule generation for weekOffset: ${weekOffset}`);
  console.log(`📅 ${weekOffset === 0 ? 'CURRENT WEEK' : weekOffset > 0 ? `WEEK +${weekOffset} (FUTURE)` : `WEEK ${weekOffset} (PAST)`}`);
  console.log(`❌ SYSTEM DATE (WRONG): ${systemDate.toDateString()}`);
  console.log(`✅ CORRECTED DATE: ${correctedToday.toDateString()} (7 Oct 2025)`);
  
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
          const carPlates = (customer.CarPlates || '').split(',').map(p => p.trim()).filter(p => p);
          if (carPlates.length === 0) carPlates.push('');
          
          carPlates.forEach(carPlate => {
            const visitNumber = index + 1;
            appointments.push({
              day: dayTime.day,
              time: dayTime.time,
              customerId: customer.CustomerID,
              customerName: customer.Name,
              villa: customer.Villa,
              carPlate,
              washType: calculateHistoryBasedWashType(customer, carPlate, allHistory, visitNumber, weekOffset),
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
                const carPlates = (customer.CarPlates || '').split(',').map(p => p.trim()).filter(p => p);
                if (carPlates.length === 0) carPlates.push('');
                
                carPlates.forEach(carPlate => {
                  const visitNumber = dayIndex + 1;
                  appointments.push({
                    day,
                    time,
                    customerId: customer.CustomerID,
                    customerName: customer.Name,
                    villa: customer.Villa,
                    carPlate,
                    washType: calculateHistoryBasedWashType(customer, carPlate, allHistory, visitNumber, weekOffset),
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
        const carPlates = (customer.CarPlates || '').split(',').map(p => p.trim()).filter(p => p);
        if (carPlates.length === 0) carPlates.push('');
        
        carPlates.forEach(carPlate => {
          const visitNumber = index + 1;
          appointments.push({
            day: appointment.day,
            time: appointment.time,
            customerId: customer.CustomerID,
            customerName: customer.Name,
            villa: customer.Villa,
            carPlate,
            washType: calculateHistoryBasedWashType(customer, carPlate, allHistory, visitNumber, weekOffset),
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
    isLocked: 'TRUE'
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
      isLocked: task.isLocked || 'FALSE'
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
      isLocked: 'TRUE'
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
      isLocked: task.isLocked || 'FALSE'
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
function calculateHistoryBasedWashType(customer, carPlate, allHistory, visitNumber, weekOffset = 0) {
  const packageName = customer.Washman_Package || '';
  const carPlates = (customer.CarPlates || '').split(',').map(p => p.trim()).filter(p => p);
  const isMultiCar = carPlates.length > 1;
  const carIndex = carPlates.indexOf(carPlate);
  
  // 2 Ext Only packages
  if (packageName.toLowerCase().includes('2 ext only')) {
    return 'EXT';
  }
  
  // Bi-weekly packages
  if (packageName.toLowerCase().includes('bi week')) {
    const carHistory = allHistory.filter(record => 
      record.CarPlate === carPlate && record.CustomerID === customer.CustomerID
    ).sort((a, b) => new Date(b.WashDate) - new Date(a.WashDate));
    
    // تتبع خاص لعميل P1 012
    const isP1Customer = customer.Villa === 'P1 012' || customer.CustomerID === 'CUST-018' || customer.Name?.toLowerCase().includes('mostafa');
    
    // تتبع جميع العملاء bi-weekly
    console.log(`🔄 [BI-WEEKLY] ${customer.CustomerID} (${customer.Name}) Villa:${customer.Villa} - ${carPlate} - WeekOffset:${weekOffset}`);
    
    if (isP1Customer) {
      console.log(`\n🎯 [MOSTAFA P1-012 TRACKING] ${customer.CustomerID} (${customer.Name}) Villa:${customer.Villa} - ${carPlate}:`);
      console.log(`  📦 Package: ${packageName}`);
      console.log(`  📅 WeekOffset: ${weekOffset} (${weekOffset === 0 ? 'Current Week' : weekOffset > 0 ? 'Future Week' : 'Past Week'})`);
      console.log(`  📋 History records: ${carHistory.length}`);
      if (carHistory.length > 0) {
        console.log(`  📊 Raw history data:`, carHistory[0]);
      }
    }
    
    if (carHistory.length === 0) {
      if (isP1Customer) {
        console.log(`  ❌ No history - using weekOffset % 2 = ${weekOffset % 2}`);
      }
      // بدون تاريخ - استخدم weekOffset للحساب
      if (weekOffset % 2 === 0) {
        const result = calculateMultiCarWashType(packageName, visitNumber, carIndex, isMultiCar);
        if (isP1Customer) {
          console.log(`  ✅ Result: ${result} (even week - interior time)`);
        }
        return result;
      } else {
        if (isP1Customer) {
          console.log(`  ✅ Result: EXT (odd week - exterior only)`);
        }
        return 'EXT';
      }
    }
    
    // إصلاح parsing التاريخ للصيغة DD-MM-YYYY
    const rawDate = carHistory[0].WashDate;
    let lastWashDate;
    
    if (rawDate && rawDate.includes('-')) {
      // تحويل من DD-MM-YYYY إلى YYYY-MM-DD
      const parts = rawDate.split('-');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        
        const isoDate = `${year}-${month}-${day}`;
        lastWashDate = new Date(isoDate);
        
        if (isP1Customer) {
          console.log(`  🔧 Parsed date: '${rawDate}' (DD-MM-YYYY) → '${isoDate}' → ${lastWashDate.toDateString()}`);
        }
      } else {
        lastWashDate = new Date(rawDate);
      }
    } else {
      lastWashDate = new Date(rawDate);
    }
    // ضبط التاريخ الصحيح - 7 أكتوبر 2025
    const today = new Date('2025-10-07'); // التاريخ الصحيح
    const currentWeekStart = new Date(today);
    const dayOfWeek = today.getDay(); // 0=Sunday, 6=Saturday
    const daysToSaturday = dayOfWeek === 6 ? 0 : (6 - dayOfWeek) % 7;
    currentWeekStart.setDate(today.getDate() - (dayOfWeek === 0 ? 1 : dayOfWeek + 1)); // Go to last Saturday
    
    // إضافة weekOffset
    currentWeekStart.setDate(currentWeekStart.getDate() + (weekOffset * 7));
    const daysSinceLastWash = Math.floor((currentWeekStart - lastWashDate) / (1000 * 60 * 60 * 24));
    
    const weeksSinceLastWash = Math.floor(daysSinceLastWash / 7);
    
    if (isP1Customer) {
      console.log(`  🕐 Last wash: ${lastWashDate.toDateString()} (${lastWashDate.getTime() ? 'Valid' : 'Invalid'})`);
      console.log(`  📆 Target week start: ${currentWeekStart.toDateString()}`);
      console.log(`  📅 Today: ${today.toDateString()}`);
      console.log(`  ⏱️ Days since last wash: ${daysSinceLastWash}`);
      console.log(`  📊 Weeks since last wash: ${weeksSinceLastWash}`);
    }
    
    // الحساب الصحيح: إذا مر أسبوعين أو أكثر = وقت الداخلي
    if (weeksSinceLastWash >= 2) {
      // bi-weekly: بعد أسبوعين = غسيل داخلي
      if (isP1Customer) {
        console.log(`  ✅ Result: INT (>=2 weeks, bi-weekly interior time!)`);
        console.log(`  🎯 P1-012 gets INTERIOR wash this week!\n`);
      }
      return 'INT';
    } else {
      if (isP1Customer) {
        console.log(`  ✅ Result: EXT (<2 weeks, exterior only)`);
        console.log(`  ⏳ P1-012 needs to wait ${2 - weeksSinceLastWash} more week(s) for interior\n`);
      }
      return 'EXT';
    }
  }
  
  return calculateMultiCarWashType(packageName, visitNumber, carIndex, isMultiCar);
}

function calculateMultiCarWashType(packageName, visitNumber, carIndex, isMultiCar) {
  if (!isMultiCar) {
    if (packageName.toLowerCase().includes('2 ext 1 int week') && visitNumber === 2) {
      return 'INT';
    }
    if (packageName.toLowerCase().includes('3 ext 1 int week') && visitNumber === 2) {
      return 'INT';
    }
    return 'EXT';
  }
  
  if (packageName.toLowerCase().includes('2 ext 1 int week')) {
    if (visitNumber === 1) {
      return carIndex === 1 ? 'INT' : 'EXT';
    }
    if (visitNumber === 2) {
      return carIndex === 0 ? 'INT' : 'EXT';
    }
  }
  
  if (packageName.toLowerCase().includes('3 ext 1 int week')) {
    if (visitNumber === 1) {
      return carIndex === 1 ? 'INT' : 'EXT';
    }
    if (visitNumber === 2) {
      return carIndex === 0 ? 'INT' : 'EXT';
    }
    if (visitNumber === 3) {
      return 'EXT';
    }
  }
  
  return 'EXT';
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