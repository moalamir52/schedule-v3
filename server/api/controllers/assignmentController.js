const { getCustomers, getWorkers, getAllHistory, getScheduledTasks, clearAndWriteSheet, addRowToSheet, addAuditLog, updateTaskInSheet } = require('../../services/googleSheetsService');
const { determineIntCarForCustomer, checkIfFirstWeekOfBiWeekCycle } = require('../../services/logicService');

const autoAssignSchedule = async (req, res) => {
  const weekOffset = parseInt(req.params.weekOffset) || 0;
  const showAllSlots = req.body.showAllSlots === true;
  
  const today = new Date();
  
  try {
    // 1. Fetch All Data
    const [customers, workers, allHistory, existingSchedule] = await Promise.all([
      getCustomers(),
      getWorkers(),
      getAllHistory(),
      getScheduledTasks()
    ]);
    
    // 2. Filter customers based on mode
    let activeCustomers;
    if (showAllSlots === true || showAllSlots === 'true') {
      // Show all active and booked customers for capacity planning
      activeCustomers = customers.filter(c => c.Status === 'Active' || c.Status === 'Booked');

    } else {
      // Normal mode: include Active and Booked customers, filter out completed tasks
      activeCustomers = customers.filter(c => c.Status === 'Active' || c.Status === 'Booked');

    }
    
    const activeWorkers = workers.filter(worker => worker.Status === 'Active');
    
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
    const appointmentResult = generateAllAppointments(activeCustomers, allHistory, weekOffset, showAllSlots);
    const potentialAppointments = appointmentResult.appointments || appointmentResult;
    const manualInputCustomers = appointmentResult.manualInputRequired || [];
    
    // Add actual dates to appointments
    const appointmentsWithDates = addActualDatesToAppointments(potentialAppointments, weekOffset);
    

    
    // 4. Filter Out Appointments Already Covered by Locked Tasks or Completed/Cancelled
    const completedTasksThisWeek = showAllSlots ? [] : getCompletedTasksForWeek(allHistory, weekOffset);
    const unlockedAppointments = filterUnlockedAppointments(appointmentsWithDates, lockedTasks, completedTasksThisWeek);
    

    
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
    // Only save pending/future tasks, completed tasks should only be in wash_history
    await clearAndWriteSheet('ScheduledTasks', finalSchedule);
    
    const endTime = new Date();

    
    let message = showAllSlots 
      ? `Full capacity view: ${finalSchedule.length} total slots, ${lockedTasks.length} locked tasks, ${assignedUnlockedTasks.length} available appointments`
      : `Schedule updated successfully. ${assignedUnlockedTasks.length} new appointments added, ${lockedTasks.length} locked tasks preserved, ${completedTasksThisWeek?.length || 0} completed tasks excluded.`;
    
    if (manualInputCustomers.length > 0) {
      message += ` Note: ${manualInputCustomers.length} customers require manual wash type input due to incomplete bi-weekly cycle data.`;
    }
    
    res.json({
      success: true,
      message,
      totalAppointments: finalSchedule.length,
      lockedTasks: lockedTasks.length,
      newAssignments: assignedUnlockedTasks.length,
      completedTasks: showAllSlots ? 0 : (completedTasksThisWeek?.length || 0),
      showAllSlots,
      manualInputRequired: manualInputCustomers,
      assignments: finalSchedule
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

function generateAllAppointments(customers, allHistory, weekOffset, showAllSlots = false) {
  const appointments = [];
  const manualInputRequired = [];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = ['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'];
  
  customers.forEach(customer => {
    if (!customer || (customer.Status !== 'Active' && customer.Status !== 'Booked') || !customer.CustomerID) return;
    
    // Store start date for later filtering per appointment
    const customerStartDate = customer['start date'] ? parseCustomerStartDate(customer['start date']) : null;
    
    // Debug for specific customers

    
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
      customerDays.forEach((day, dayIndex) => {
        if (days.includes(day)) {
          // For multi-car customers, determine which car gets INT for this day
          let intCarForThisVisit = null;
          if (carPlates.length > 1) {
            intCarForThisVisit = determineIntCarForCustomer(carPlates, allHistory, dayIndex, weekOffset);
          }
          
          carTimeMatches.forEach((carTime, index) => {
            if (timeSlots.includes(carTime.time)) {
              // Find matching car plate
              const matchingCarPlate = carPlates.find(plate => 
                plate.toLowerCase().includes(carTime.car.toLowerCase()) || 
                carTime.car.toLowerCase().includes(plate.toLowerCase())
              ) || carTime.car;
              
              const visitNumber = dayIndex + 1;
              const washType = calculateHistoryBasedWashType(customer, matchingCarPlate, allHistory, visitNumber, weekOffset, intCarForThisVisit, showAllSlots);
              
              if (washType === 'SKIP') {
                return;
              }
              
              // Check if appointment date is on or after customer start date
              const appointmentDate = getAppointmentDate(day, weekOffset);
              if (!showAllSlots && customerStartDate && appointmentDate < customerStartDate) {
                return;
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
          });
        }
      });
    }
    // Generate appointments from day@time format in Time field
    else if (dayTimeMatches.length > 0) {
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
            const washType = calculateHistoryBasedWashType(customer, carPlate, allHistory, visitNumber, weekOffset, intCarForThisVisit, showAllSlots);
            
            if (washType === 'SKIP') {
              return;
            }
            
            // Check if appointment date is on or after customer start date
            const appointmentDate = getAppointmentDate(dayTime.day, weekOffset);
            if (!showAllSlots && customerStartDate && appointmentDate < customerStartDate) {
              return;
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
            // For multi-car customers, determine which car gets INT for this day
            let intCarForThisVisit = null;
            if (carPlates.length > 1) {
              intCarForThisVisit = determineIntCarForCustomer(carPlates, allHistory, dayIndex, weekOffset);
            }
            
            times.forEach(time => {
              if (timeSlots.includes(time)) {
                
                carPlates.forEach(carPlate => {
                  const visitNumber = dayIndex + 1;
                  const washType = calculateHistoryBasedWashType(customer, carPlate, allHistory, visitNumber, weekOffset, intCarForThisVisit, showAllSlots);
                  
                  if (washType === 'SKIP') {
                    return;
                  }
                  
                  // Check if appointment date is on or after customer start date
                  const appointmentDate = getAppointmentDate(day, weekOffset);
                  if (!showAllSlots && customerStartDate && appointmentDate < customerStartDate) {
                    return;
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
        // Find day index for this specific appointment
        const dayIndex = customerDays.indexOf(appointment.day);
        
        // For multi-car customers, determine which car gets INT for this day
        let intCarForThisVisit = null;
        if (carPlates.length > 1) {
          intCarForThisVisit = determineIntCarForCustomer(carPlates, allHistory, dayIndex >= 0 ? dayIndex : index, weekOffset);
        }
        
        carPlates.forEach(carPlate => {
          const visitNumber = dayIndex >= 0 ? dayIndex + 1 : index + 1;
          const washType = calculateHistoryBasedWashType(customer, carPlate, allHistory, visitNumber, weekOffset, intCarForThisVisit, showAllSlots);
          
          if (washType === 'SKIP') {
            return;
          }
          
          // Check if appointment date is on or after customer start date
          const appointmentDate = getAppointmentDate(appointment.day, weekOffset);
          if (!showAllSlots && customerStartDate && appointmentDate < customerStartDate) {
            return;
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
  
  sortedTimeSlots.forEach(timeSlotKey => {
    const tasks = timeSlotGroups[timeSlotKey];
    const [day, time] = timeSlotKey.split('-');
    
    // Get workers busy with locked tasks at this time slot
    const busyWorkersFromLocked = lockedTasks
      .filter(task => task.Day === day && task.Time === time)
      .map(task => task.WorkerID);
    
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
        // Find next available worker (not busy with locked tasks or other assignments)
        const busyWorkers = [...busyWorkersFromLocked, ...Object.values(workerCustomerMap).map(w => w.WorkerID)];
        const availableWorker = activeWorkers.find(w => !busyWorkers.includes(w.WorkerID));
        
        if (availableWorker) {
          task.workerName = availableWorker.Name;
          task.workerId = availableWorker.WorkerID;
          task.isLocked = 'FALSE';
          workerCustomerMap[task.customerId] = availableWorker;
          assigned = true;
        }
      }
      
      if (assigned) {
        task.appointmentDate = task.actualDate || '';
        task.scheduleDate = new Date().toISOString().split('T')[0];
        task.isBiWeekly = task.packageType?.includes('bi week') || false;
        task.customerStatus = task.customerStatus || 'Active'; // Preserve customer status
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

// Keep existing functions for other endpoints
const getSchedule = async (req, res) => {
  try {
    const scheduledTasks = await getScheduledTasks();
    
    const assignments = scheduledTasks.map(task => ({
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
      appointmentDate: '',
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
    
    // Log the manual appointment (disabled temporarily)

    
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
        // Drag and drop: update all customer cars to same worker
        const customerTasks = existingTasks.filter(t => 
          t.CustomerID === task.CustomerID && 
          t.Day === task.Day && 
          t.Time === task.Time
        );
        

        
        customerTasks.forEach(customerTask => {
          const customerTaskIndex = existingTasks.findIndex(t => 
            t.CustomerID === customerTask.CustomerID && 
            t.Day === customerTask.Day && 
            t.Time === customerTask.Time && 
            t.CarPlate === customerTask.CarPlate
          );
          
          if (customerTaskIndex !== -1) {
            const oldWorker = existingTasks[customerTaskIndex].WorkerName;
            
            existingTasks[customerTaskIndex].WorkerName = newWorkerName;
            existingTasks[customerTaskIndex].WorkerID = newWorker.WorkerID;
            existingTasks[customerTaskIndex].isLocked = 'TRUE';
            

          }
        });
      }
    }
    
    // Always use full rewrite to ensure all customer cars are updated together

    const uniqueTasks = [];
    const seen = new Set();
    existingTasks.forEach(task => {
      const key = `${task.CustomerID || task.customerId}-${task.Day || task.day}-${task.Time || task.time}-${(task.CarPlate || task.carPlate) || 'NOPLATE'}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueTasks.push(task);
      }
    });
    
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
    
    await clearAndWriteSheet('ScheduledTasks', updatedSchedule);
    

    

    
    res.json({
      success: true,
      message: 'Task updated and locked successfully'
    });
    
  } catch (error) {

    res.status(500).json({ success: false, error: error.message, stack: error.stack });
  }
};

// Helper functions
function calculateHistoryBasedWashType(customer, carPlate, allHistory, visitNumber, weekOffset = 0, intCarForThisVisit = null, showAllSlots = false) {
  const packageName = customer.Washman_Package || '';
  const carPlates = (customer.CarPlates || '').split(',').map(p => p.trim()).filter(p => p);
  
  // Rule 1: Packages without 'INT' are always EXT
  if (!packageName.toLowerCase().includes('int')) {
    return 'EXT';
  }
  
  let washType = 'EXT';
  
  // Rule 2: Single car customers - INT based on package type
  if (carPlates.length === 1) {
    if (packageName.toLowerCase().includes('2 ext 1 int')) {
      washType = (visitNumber === 2) ? 'INT' : 'EXT';
    }
    else if (packageName.toLowerCase().includes('3 ext 1 int')) {
      washType = (visitNumber === 2) ? 'INT' : 'EXT';
    }
  } else {
    // Rule 3: Multi-car customers - alternate INT between cars per visit
    washType = (carPlate === intCarForThisVisit) ? 'INT' : 'EXT';
    
    // Apply package-specific rules for multi-car customers
    if (packageName.toLowerCase().includes('2 ext 1 int')) {
      if (visitNumber >= 3) {
        washType = 'EXT';
      }
    }
    else if (packageName.toLowerCase().includes('3 ext 1 int')) {
      if (visitNumber >= 3) {
        washType = 'EXT';
      }
    }
  }
  
  // Rule 4: For bi-week packages, determine wash type based on history
  if (packageName.toLowerCase().includes('bi week')) {
    const biWeekResult = checkIfFirstWeekOfBiWeekCycleFromHistory(carPlates, allHistory, weekOffset, customer);
    
    if (biWeekResult === 'UNKNOWN') {
      // In Show All Slots mode, use default pattern instead of ?
      if (showAllSlots) {
        return (weekOffset % 2 === 0) ? washType : 'EXT';
      }
      return '?'; // Show question mark for insufficient data in normal mode
    }
    
    if (biWeekResult === 'SKIP') {
      return 'SKIP'; // Don't show customer this week
    }
    

    
    // Return INT or EXT based on bi-weekly calculation
    return biWeekResult ? washType : 'EXT';
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
  
  // For bi-weekly customers, need at least 2 weeks of data to determine pattern
  if (daysSinceLastWash < 14) {
    return 'UNKNOWN';
  }
  
  // Determine wash type based on last wash type
  const lastWashType = customerHistory[0].WashType;
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
    
    // Debug for specific dates

    
    return result;
  }
  
  // Fallback to standard date parsing
  return new Date(dateStr);
}

function getCurrentWeekStart(weekOffset) {
  const today = new Date();
  const currentDay = today.getDay();
  
  let mondayOfWeek = new Date(today);
  if (currentDay === 0) {
    mondayOfWeek.setDate(today.getDate() + 1);
  } else if (currentDay === 1) {
    // Already Monday
  } else {
    mondayOfWeek.setDate(today.getDate() - currentDay + 1);
  }
  
  mondayOfWeek.setDate(mondayOfWeek.getDate() + (weekOffset * 7));
  mondayOfWeek.setHours(0, 0, 0, 0);
  
  // Debug for week offset 0

  
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

const cancelBooking = async (req, res) => {
  try {
    const { taskId } = req.body;
    
    if (!taskId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Task ID is required' 
      });
    }
    
    const existingTasks = await getScheduledTasks();
    
    // Find and remove only the specific task
    const updatedTasks = existingTasks.filter(task => {
      const currentTaskId = `${task.CustomerID}-${task.Day}-${task.Time}-${task.CarPlate || 'NOPLATE'}`;
      return currentTaskId !== taskId;
    });
    
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
    
    res.json({
      success: true,
      message: 'Booking cancelled successfully'
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

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
        
        if (!newWorker) continue;
        
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
          const day = taskIdParts[2];
          const time = taskIdParts[3];
          
          // Update all customer tasks at this time slot
          updatedTasks.forEach(task => {
            if ((task.CustomerID || task.customerId) === customerId &&
                (task.Day || task.day) === day &&
                (task.Time || task.time) === time) {
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
          });
        }
        processedChanges++;
      }
    }
    
    // Save all changes to Google Sheets
    const formattedTasks = updatedTasks.map(task => ({
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
    
    await clearAndWriteSheet('ScheduledTasks', formattedTasks);
    
    res.json({
      success: true,
      message: `Successfully processed ${processedChanges} changes and saved to server`,
      processedChanges
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { 
  autoAssignSchedule, 
  getSchedule,
  addManualAppointment,
  getAvailableWorkers,
  updateTaskAssignment,
  cancelBooking,
  batchUpdateTasks
};