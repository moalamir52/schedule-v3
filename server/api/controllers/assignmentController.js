const { getCustomers, getWorkers, getAllHistory, clearSheet, addRowsToSheet, getScheduledTasks, addRowToSheet } = require('../../services/googleSheetsService');

const autoAssignSchedule = async (req, res) => {
  const weekOffset = parseInt(req.params.weekOffset) || 0;
  console.log(`[ASSIGNMENT ENGINE] ==> Starting assignment for week offset: ${weekOffset}...`);
  
  try {
    // 1. Fetch All Necessary Data
    const workers = await getWorkers();
    const activeWorkers = workers.filter(worker => worker.Status === 'Active');
    const customers = await getCustomers();
    const allHistory = await getAllHistory();
    
    console.log(`[ENGINE] Data loaded: ${customers.length} customers, ${activeWorkers.length} workers, ${allHistory.length} history records`);
    
    if (activeWorkers.length === 0) {
      return res.status(400).json({ success: false, error: 'No active workers found.' });
    }
    
    // 2. Generate All Appointments with Correct Wash Type
    const appointments = [];
    const days = ['Saturday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const timeSlots = ['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'];
    
    customers.forEach(customer => {
      if (!customer || customer.Status !== 'Active' || !customer.CustomerID) return;
      
      const timeField = customer.Time || '';
      const daysField = customer.Days || '';
      const notesField = customer.Notes || '';
      
      // Parse specific day/time overrides from Notes
      console.log(`[NOTES] Processing ${customer.Name}: "${notesField}"`);
      
      const specificPattern = /(Sat|Mon|Tue|Wed|Thu|Thurs|Fri)[@\s]*(at\s*)?(\d{1,2}:\d{2}\s*(AM|PM))/gi;
      const specificMatches = [];
      let match;
      
      while ((match = specificPattern.exec(notesField)) !== null) {
        const dayName = expandDayName(match[1]);
        const timeStr = match[3];
        console.log(`[NOTES] Found override: ${dayName} at ${timeStr}`);
        specificMatches.push({ day: dayName, time: timeStr });
      }
      
      const specificDays = specificMatches.map(m => m.day);
      console.log(`[NOTES] ${customer.Name} specific days:`, specificDays);
      
      // Get customer's scheduled days for visit numbering
      const customerDays = parseDaysField(daysField);
      
      // Check if Time field contains day@time format
      const dayTimePattern = /(Sat|Mon|Tue|Wed|Thu|Thurs|Fri)@(\d{1,2}:\d{2}\s*(AM|PM))/gi;
      const dayTimeMatches = [];
      let dayTimeMatch;
      
      while ((dayTimeMatch = dayTimePattern.exec(timeField)) !== null) {
        const dayName = expandDayName(dayTimeMatch[1]);
        const timeStr = dayTimeMatch[2];
        console.log(`[TIME FIELD] Found day@time: ${dayName} at ${timeStr}`);
        dayTimeMatches.push({ day: dayName, time: timeStr });
      }
      
      // Generate appointments from day@time format in Time field
      if (dayTimeMatches.length > 0) {
        dayTimeMatches.forEach((dayTime, index) => {
          if (days.includes(dayTime.day) && timeSlots.includes(dayTime.time)) {
            console.log(`[TIME FIELD] Adding ${customer.Name} - ${dayTime.day} at ${dayTime.time}`);
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
            // Check if this day has a specific time override in Notes
            const hasSpecificOverride = specificDays.includes(day);
            
            if (!hasSpecificOverride) {
              // Use regular time for this day
              times.forEach(time => {
                if (timeSlots.includes(time)) {
                  console.log(`[REGULAR] Adding ${customer.Name} - ${day} at ${time} (regular schedule)`);
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
            } else {
              console.log(`[OVERRIDE] Skipping regular time for ${customer.Name} - ${day} (has Notes override)`);
            }
          }
        });
      }
      
      // Add specific appointments from Notes (override regular times)
      specificMatches.forEach((appointment, index) => {
        console.log(`[NOTES] Processing specific appointment: ${appointment.day} at ${appointment.time}`);
        console.log(`[NOTES] Day valid: ${days.includes(appointment.day)}, Time valid: ${timeSlots.includes(appointment.time)}`);
        
        if (days.includes(appointment.day) && timeSlots.includes(appointment.time)) {
          const carPlates = (customer.CarPlates || '').split(',').map(p => p.trim()).filter(p => p);
          if (carPlates.length === 0) carPlates.push('');
          
          carPlates.forEach(carPlate => {
            const visitNumber = index + 1; // 1-based visit number for specific appointments
            console.log(`[NOTES] Adding specific appointment: ${customer.Name} - ${appointment.day} ${appointment.time}`);
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
        } else {
          console.log(`[NOTES] Skipping invalid appointment: ${appointment.day} at ${appointment.time}`);
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
    
    console.log(`[ENGINE] Generated ${uniqueAppointments.length} unique appointments`);
    
    // 3. Implement Location-Aware Assignment
    const timeSlotGroups = {};
    uniqueAppointments.forEach(appointment => {
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
    
    sortedTimeSlots.forEach(timeSlotKey => {
      const tasks = timeSlotGroups[timeSlotKey];
      const workerVillaMap = {}; // villa -> worker mapping for this time slot
      
      console.log(`[ENGINE] Processing ${timeSlotKey}: ${tasks.length} tasks`);
      
      tasks.forEach(task => {
        let assigned = false;
        
        // First, check if there's already a worker at this villa
        if (workerVillaMap[task.villa]) {
          const assignedWorker = workerVillaMap[task.villa];
          task.workerName = assignedWorker.Name;
          task.workerId = assignedWorker.WorkerID;
          assigned = true;
          console.log(`[ASSIGN] Same villa: ${task.customerName} (${task.carPlate} - ${task.washType}) -> ${assignedWorker.Name} at Villa ${task.villa}`);
        } else {
          // Find next available worker (not assigned to any villa in this time slot)
          const busyWorkers = Object.values(workerVillaMap).map(w => w.WorkerID);
          const availableWorker = activeWorkers.find(w => !busyWorkers.includes(w.WorkerID));
          
          if (availableWorker) {
            task.workerName = availableWorker.Name;
            task.workerId = availableWorker.WorkerID;
            workerVillaMap[task.villa] = availableWorker;
            assigned = true;
            console.log(`[ASSIGN] New assignment: ${task.customerName} (${task.carPlate} - ${task.washType}) -> ${availableWorker.Name} at Villa ${task.villa}`);
          }
        }
        
        if (!assigned) {
          console.log(`[WARNING] Could not assign ${task.customerName} at ${timeSlotKey} - all workers busy`);
        }
      });
    });
    
    // 4. Preserve manual appointments and merge with auto-generated ones
    console.log('[ENGINE] ==> Preserving manual appointments...');
    
    const existingSchedule = await getScheduledTasks();
    const manualAppointments = existingSchedule.filter(appointment => 
      appointment.CustomerID && appointment.CustomerID.startsWith('MANUAL_')
    );
    
    console.log(`[ENGINE] Found ${manualAppointments.length} manual appointments to preserve`);
    
    // Convert manual appointments to the same format
    const preservedManual = manualAppointments.map(appointment => ({
      day: appointment.Day,
      time: appointment.Time,
      customerId: appointment.CustomerID,
      customerName: appointment.CustomerName,
      villa: appointment.Villa,
      carPlate: appointment.CarPlate || '',
      washType: appointment.WashType || 'EXT',
      workerName: appointment.WorkerName,
      workerId: appointment.WorkerID,
      packageType: appointment.PackageType || ''
    }));
    
    // Merge auto-generated with preserved manual appointments
    const finalSchedule = [...uniqueAppointments, ...preservedManual];
    
    console.log(`[ENGINE] Final schedule: ${uniqueAppointments.length} auto + ${preservedManual.length} manual = ${finalSchedule.length} total`);
    
    // 5. Persist the complete schedule to Google Sheets
    console.log('[ENGINE] ==> Saving complete schedule to Google Sheets...');
    
    try {
      await clearSheet('ScheduledTasks');
      await addRowsToSheet('ScheduledTasks', finalSchedule);
      console.log('[ENGINE] ==> Schedule saved successfully!');
    } catch (sheetError) {
      console.error('[ENGINE] Sheet save error:', sheetError);
      // Continue even if sheet save fails
    }
    
    // 6. Return the Final, Detailed Schedule
    console.log('[ENGINE] ==> Final intelligent assignment completed successfully!');
    
    res.json({
      success: true,
      message: 'Schedule generated and saved successfully.',
      totalAppointments: finalSchedule.length,
      totalWorkers: activeWorkers.length,
      assignments: finalSchedule
    });
    
  } catch (error) {
    console.error('[ENGINE] ERROR:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

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
      packageType: task.PackageType || ''
    }));
    
    res.json({
      success: true,
      message: 'Schedule loaded successfully',
      totalAppointments: assignments.length,
      assignments
    });
    
  } catch (error) {
    console.error('[GET SCHEDULE] ERROR:', error);
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
    console.error('[GET AVAILABLE WORKERS] ERROR:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const addManualAppointment = async (req, res) => {
  console.log('[MANUAL ADD] ==> Adding new appointment...');
  
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
      workerId: worker.WorkerID
    };
    
    await addRowToSheet('ScheduledTasks', [newAppointment]);
    
    console.log(`[MANUAL ADD] ==> Successfully added: ${villa} - ${day} ${time} - ${workerName}`);
    
    res.json({
      success: true,
      message: 'Appointment added successfully',
      appointment: newAppointment
    });
    
  } catch (error) {
    console.error('[MANUAL ADD] ERROR:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateWashType = async (req, res) => {
  console.log('[MANUAL OVERRIDE] ==> Updating wash type...');
  
  try {
    const { taskId, newWashType, newWorkerName } = req.body;
    
    if (!taskId || !newWashType) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: taskId, newWashType' 
      });
    }
    
    if (!['EXT', 'INT'].includes(newWashType)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid wash type. Must be EXT or INT' 
      });
    }
    
    const existingTasks = await getScheduledTasks();
    const taskIndex = existingTasks.findIndex(task => 
      `${task.CustomerID}-${task.Day}-${task.Time}-${task.CarPlate}` === taskId
    );
    
    if (taskIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Task not found' 
      });
    }
    
    // Update the wash type and worker if provided
    existingTasks[taskIndex].WashType = newWashType;
    if (newWorkerName) {
      existingTasks[taskIndex].WorkerName = newWorkerName;
    }
    
    // Save back to sheet
    await clearSheet('ScheduledTasks');
    await addRowsToSheet('ScheduledTasks', existingTasks.map(task => ({
      day: task.Day,
      time: task.Time,
      customerId: task.CustomerID,
      customerName: task.CustomerName,
      villa: task.Villa,
      carPlate: task.CarPlate,
      washType: task.WashType,
      workerName: task.WorkerName,
      workerId: task.WorkerID,
      packageType: task.PackageType || ''
    })));
    
    console.log(`[MANUAL OVERRIDE] ==> Updated ${taskId} to ${newWashType}`);
    
    res.json({
      success: true,
      message: `Wash type updated to ${newWashType}`,
      updatedTask: existingTasks[taskIndex]
    });
    
  } catch (error) {
    console.error('[MANUAL OVERRIDE] ERROR:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const cancelBooking = async (req, res) => {
  console.log('[CANCEL BOOKING] ==> Cancelling booking...');
  
  try {
    const { taskId } = req.body;
    
    if (!taskId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required field: taskId' 
      });
    }
    
    const existingTasks = await getScheduledTasks();
    const taskIndex = existingTasks.findIndex(task => 
      `${task.CustomerID}-${task.Day}-${task.Time}-${task.CarPlate}` === taskId
    );
    
    if (taskIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Booking not found' 
      });
    }
    
    const cancelledTask = existingTasks[taskIndex];
    
    // Remove the booking from schedule
    const filteredTasks = existingTasks.filter((task, index) => index !== taskIndex);
    
    // Save updated schedule
    await clearSheet('ScheduledTasks');
    await addRowsToSheet('ScheduledTasks', filteredTasks.map(task => ({
      day: task.Day,
      time: task.Time,
      customerId: task.CustomerID,
      customerName: task.CustomerName,
      villa: task.Villa,
      carPlate: task.CarPlate,
      washType: task.WashType,
      workerName: task.WorkerName,
      workerId: task.WorkerID,
      packageType: task.PackageType || ''
    })));
    
    // Log cancellation to history (optional)
    try {
      await addRowToSheet('CancelledBookings', [{
        cancelledAt: new Date().toISOString(),
        customerId: cancelledTask.CustomerID,
        customerName: cancelledTask.CustomerName,
        villa: cancelledTask.Villa,
        day: cancelledTask.Day,
        time: cancelledTask.Time,
        carPlate: cancelledTask.CarPlate,
        washType: cancelledTask.WashType,
        workerName: cancelledTask.WorkerName,
        reason: 'User cancelled'
      }]);
    } catch (logError) {
      console.log('[CANCEL BOOKING] Warning: Could not log to CancelledBookings sheet:', logError.message);
    }
    
    console.log(`[CANCEL BOOKING] ==> Successfully cancelled: ${cancelledTask.CustomerName} - ${cancelledTask.Day} ${cancelledTask.Time}`);
    
    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      cancelledBooking: cancelledTask
    });
    
  } catch (error) {
    console.error('[CANCEL BOOKING] ERROR:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteManualAppointment = async (req, res) => {
  console.log('[MANUAL DELETE] ==> Deleting appointment...');
  
  try {
    const { customerId } = req.params;
    
    if (!customerId || !customerId.startsWith('MANUAL_')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid manual appointment ID' 
      });
    }
    
    const existingTasks = await getScheduledTasks();
    const filteredTasks = existingTasks.filter(task => task.CustomerID !== customerId);
    
    await clearSheet('ScheduledTasks');
    await addRowsToSheet('ScheduledTasks', filteredTasks.map(task => ({
      day: task.Day,
      time: task.Time,
      customerId: task.CustomerID,
      customerName: task.CustomerName,
      villa: task.Villa,
      carPlate: task.CarPlate,
      washType: task.WashType,
      workerName: task.WorkerName,
      workerId: task.WorkerID,
      packageType: task.PackageType || ''
    })));
    
    console.log(`[MANUAL DELETE] ==> Successfully deleted: ${customerId}`);
    
    res.json({
      success: true,
      message: 'Appointment deleted successfully'
    });
    
  } catch (error) {
    console.error('[MANUAL DELETE] ERROR:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const exportSchedule = async (req, res) => {
  console.log('[EXPORT] ==> Exporting schedule...');
  
  try {
    const scheduledTasks = await getScheduledTasks();
    
    if (scheduledTasks.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No schedule data to export' 
      });
    }
    
    // Convert to CSV format
    const headers = ['Day', 'Time', 'Customer', 'Villa', 'Car Plate', 'Wash Type', 'Worker', 'Package Type'];
    const csvData = [headers];
    
    scheduledTasks.forEach(task => {
      csvData.push([
        task.Day || '',
        task.Time || '',
        task.CustomerName || '',
        task.Villa || '',
        task.CarPlate || '',
        task.WashType || '',
        task.WorkerName || '',
        task.PackageType || ''
      ]);
    });
    
    const csvContent = csvData.map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="schedule-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
    
  } catch (error) {
    console.error('[EXPORT] ERROR:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

function calculateHistoryBasedWashType(customer, carPlate, allHistory, visitNumber, weekOffset = 0) {
  const packageName = customer.Washman_Package || '';
  const carPlates = (customer.CarPlates || '').split(',').map(p => p.trim()).filter(p => p);
  const isMultiCar = carPlates.length > 1;
  const carIndex = carPlates.indexOf(carPlate);
  
  console.log(`[WASH TYPE] ${customer.Name} - ${carPlate} (Car ${carIndex + 1}/${carPlates.length}) - Visit ${visitNumber} - ${packageName}`);
  
  // 2 Ext Only packages
  if (packageName.toLowerCase().includes('2 ext only')) {
    return 'EXT';
  }
  
  // Bi-weekly packages
  if (packageName.toLowerCase().includes('bi week')) {
    const carHistory = allHistory.filter(record => 
      record.CarPlate === carPlate && record.CustomerID === customer.CustomerID
    ).sort((a, b) => new Date(b.WashDate) - new Date(a.WashDate));
    
    if (carHistory.length === 0) {
      // No history - determine based on weekOffset
      if (weekOffset % 2 === 0) {
        // Even weeks (0, 2, 4...) - first week of cycle
        return calculateMultiCarWashType(packageName, visitNumber, carIndex, isMultiCar);
      } else {
        // Odd weeks (1, 3, 5...) - second week of cycle
        return 'EXT';
      }
    }
    
    const lastWashDate = new Date(carHistory[0].WashDate);
    const currentWeekStart = new Date();
    currentWeekStart.setDate(currentWeekStart.getDate() + (weekOffset * 7));
    const daysSinceLastWash = Math.floor((currentWeekStart - lastWashDate) / (1000 * 60 * 60 * 24));
    
    // Determine cycle based on weeks since last wash and weekOffset
    const weeksSinceLastWash = Math.floor(daysSinceLastWash / 7);
    const totalWeeksFromStart = weeksSinceLastWash + weekOffset;
    
    if (totalWeeksFromStart % 2 === 0) {
      // First week of bi-weekly cycle
      return calculateMultiCarWashType(packageName, visitNumber, carIndex, isMultiCar);
    } else {
      // Second week of bi-weekly cycle - all EXT
      return 'EXT';
    }
  }
  
  // Regular weekly packages
  return calculateMultiCarWashType(packageName, visitNumber, carIndex, isMultiCar);
}

function calculateMultiCarWashType(packageName, visitNumber, carIndex, isMultiCar) {
  // Single car customers
  if (!isMultiCar) {
    if (packageName.toLowerCase().includes('2 ext 1 int week') && visitNumber === 2) {
      return 'INT';
    }
    if (packageName.toLowerCase().includes('3 ext 1 int week') && visitNumber === 2) {
      return 'INT';
    }
    return 'EXT';
  }
  
  // Multi-car customers - new alternating logic
  if (packageName.toLowerCase().includes('2 ext 1 int week')) {
    // Visit 1: Car 1 (EXT), Car 2 (EXT+INT)
    // Visit 2: Car 1 (EXT+INT), Car 2 (EXT)
    if (visitNumber === 1) {
      return carIndex === 1 ? 'INT' : 'EXT'; // Car 2 gets INT on visit 1
    }
    if (visitNumber === 2) {
      return carIndex === 0 ? 'INT' : 'EXT'; // Car 1 gets INT on visit 2
    }
  }
  
  if (packageName.toLowerCase().includes('3 ext 1 int week')) {
    // Visit 1: Car 1 (EXT), Car 2 (EXT+INT)
    // Visit 2: Car 1 (EXT+INT), Car 2 (EXT)
    // Visit 3: Car 1 (EXT), Car 2 (EXT)
    if (visitNumber === 1) {
      return carIndex === 1 ? 'INT' : 'EXT'; // Car 2 gets INT on visit 1
    }
    if (visitNumber === 2) {
      return carIndex === 0 ? 'INT' : 'EXT'; // Car 1 gets INT on visit 2
    }
    if (visitNumber === 3) {
      return 'EXT'; // All cars get EXT on visit 3
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
  deleteManualAppointment,
  exportSchedule,
  updateWashType,
  cancelBooking
};