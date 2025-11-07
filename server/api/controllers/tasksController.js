const db = require('../../services/databaseService');
const { getAllHistory } = require('../../services/googleSheetsService');

// Helper functions
const getScheduledTasks = () => db.getScheduledTasks();
const addHistoryRecord = (record) => db.addHistoryRecord(record);
const clearAndWriteSheet = (sheetName, data) => db.clearAndWriteSchedule(data);

const getAllTasks = async (req, res) => {
  try {
    const scheduledTasks = await getScheduledTasks();
    
    res.json({
      success: true,
      message: `Found ${scheduledTasks.length} total tasks`,
      tasks: scheduledTasks
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getTodayTasks = async (req, res) => {
  try {
    const [scheduledTasks, allHistory] = await Promise.all([
      getScheduledTasks(),
      getAllHistory()
    ]);
    
    // Get day name and week offset from query parameters
    const requestedDay = req.query.day;
    const weekOffset = parseInt(req.query.weekOffset) || 0;
    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = requestedDay || dayNames[today.getDay()];
    
    // Calculate the actual date for the requested day and week
    const targetDate = new Date(today);
    const currentDay = today.getDay();
    const selectedDayIndex = dayNames.indexOf(todayName);
    targetDate.setDate(today.getDate() - currentDay + selectedDayIndex + (weekOffset * 7));
    const targetDateString = targetDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    const targetDateFormatted = formatDateForHistory(targetDate.toISOString().split('T')[0]);
    
    // Filter tasks for today only
    const todayTasks = scheduledTasks.filter(task => task.Day === todayName);
    
    // Filter out completed tasks
    const incompleteTasks = todayTasks.filter(task => {
      const isCompleted = allHistory.some(record => 
        record.CustomerID === task.CustomerID &&
        record.CarPlate === (task.CarPlate || '') &&
        record.WashDate === targetDateFormatted
      );
      return !isCompleted;
    });
    
    // Format tasks for frontend
    const formattedTasks = incompleteTasks.map(task => ({
      id: `${task.CustomerID}-${task.Day}-${task.Time}-${task.CarPlate}`,
      customerID: task.CustomerID,
      customerName: task.CustomerName,
      villa: task.Villa,
      carPlate: task.CarPlate,
      washType: task.WashType,
      time: task.Time,
      workerName: task.WorkerName,
      workerID: task.WorkerID,
      packageType: task.PackageType || '',
      actualWashDate: targetDate.toISOString().split('T')[0]
    }));
    
    res.json({
      success: true,
      message: `Found ${incompleteTasks.length} incomplete tasks for ${todayName} (Week ${weekOffset})`,
      date: todayName,
      weekOffset: weekOffset,
      targetDate: targetDateString,
      tasks: formattedTasks
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const completeTask = async (req, res) => {
  try {
    const { taskId, customerID, carPlate, washType, villa, workerName, packageType, actualWashDate } = req.body;
    
    if (!taskId || !customerID || !washType) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: taskId, customerID, washType' 
      });
    }
    
    // Check if task already completed
    const allHistory = await getAllHistory();
    const washDateFormatted = actualWashDate ? formatDateForHistory(actualWashDate) : formatDateForHistory(new Date().toISOString().split('T')[0]);
    
    const existingRecord = allHistory.find(record => 
      record.CustomerID === customerID &&
      record.CarPlate === (carPlate || '') &&
      record.WashDate === washDateFormatted
    );
    
    if (existingRecord) {
      return res.status(400).json({ 
        success: false, 
        error: `Task already completed: ${customerID} - ${carPlate || 'No plate'} on ${washDateFormatted}` 
      });
    }
    
    // Create history record
    const now = new Date();
    const historyRecord = {
      WashID: `${customerID}-${carPlate}-${now.getTime()}`,
      CustomerID: customerID,
      CarPlate: carPlate || '',
      WashDate: washDateFormatted,
      PackageType: packageType || '',
      Villa: villa || '',
      WashTypePerformed: washType,
      VisitNumberInWeek: 1,
      WeekInCycle: 1,
      Status: 'Completed',
      WorkerName: workerName || ''
    };
    
    // Save to wash_history sheet
    await addHistoryRecord(historyRecord);
    
    // Remove ALL completed tasks for this customer on this date
    const existingTasks = await getScheduledTasks();
    const taskDate = actualWashDate ? new Date(actualWashDate) : new Date();
    
    const remainingTasks = existingTasks.filter(task => {
      // Remove the specific completed task
      if (`${task.CustomerID}-${task.Day}-${task.Time}-${task.CarPlate}` === taskId) {
        return false;
      }
      
      // Also remove any other tasks for same customer on same date
      if (task.AppointmentDate && task.CustomerID === customerID) {
        const appointmentDate = new Date(task.AppointmentDate);
        if (appointmentDate.toDateString() === taskDate.toDateString()) {
          console.log(`[AUTO-CLEANUP] Removing related task: ${task.CustomerName} - ${task.CarPlate} on ${task.AppointmentDate}`);
          return false;
        }
      }
      
      return true;
    });
    
    // Update scheduled tasks sheet
    const updatedSchedule = remainingTasks.map(task => ({
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
    
    await clearAndWriteSheet('ScheduledTasks', updatedSchedule);
    
    res.json({
      success: true,
      message: 'Task completed successfully',
      historyRecord
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// NEW: Cancel/Delete Task Function
const cancelTask = async (req, res) => {
  try {
    const { taskId } = req.body;
    
    if (!taskId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required field: taskId' 
      });
    }
    
    console.log(`[CANCEL] Attempting to cancel task: ${taskId}`);
    
    // Get current scheduled tasks
    const existingTasks = await getScheduledTasks();
    
    // Find the task to cancel
    const taskToCancel = existingTasks.find(task => 
      `${task.CustomerID}-${task.Day}-${task.Time}-${task.CarPlate}` === taskId
    );
    
    if (!taskToCancel) {
      return res.status(404).json({ 
        success: false, 
        error: 'Task not found' 
      });
    }
    
    // Calculate the actual date for this cancelled task
    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = today.getDay();
    const targetDayIndex = dayNames.indexOf(taskToCancel.Day);
    
    // Calculate target date (assuming current week)
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - currentDay + targetDayIndex);
    const cancelledDate = formatDateForHistory(targetDate.toISOString().split('T')[0]);
    
    // Add cancellation record to history (so auto-schedule won't regenerate it)
    const now = new Date();
    const cancellationRecord = {
      WashID: `CANCELLED-${taskToCancel.CustomerID}-${taskToCancel.CarPlate}-${now.getTime()}`,
      CustomerID: taskToCancel.CustomerID,
      CarPlate: taskToCancel.CarPlate || '',
      WashDate: cancelledDate,
      PackageType: taskToCancel.PackageType || '',
      Villa: taskToCancel.Villa || '',
      WashTypePerformed: taskToCancel.WashType,
      VisitNumberInWeek: 1,
      WeekInCycle: 1,
      Status: 'Cancelled',
      WorkerName: taskToCancel.WorkerName || ''
    };
    
    // Save cancellation to wash_history sheet
    await addHistoryRecord(cancellationRecord);
    console.log(`[CANCEL] Added cancellation record to history: ${cancelledDate}`);
    
    // Remove the cancelled task from scheduled tasks
    const remainingTasks = existingTasks.filter(task => 
      `${task.CustomerID}-${task.Day}-${task.Time}-${task.CarPlate}` !== taskId
    );
    
    console.log(`[CANCEL] Removing task: ${taskToCancel.CustomerName} - Villa ${taskToCancel.Villa} - ${taskToCancel.CarPlate}`);
    
    // Update scheduled tasks sheet (remove the cancelled task)
    const updatedSchedule = remainingTasks.map(task => ({
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
    
    await clearAndWriteSheet('ScheduledTasks', updatedSchedule);
    
    console.log(`[CANCEL] Task cancelled successfully: ${taskId}`);
    
    res.json({
      success: true,
      message: 'Task cancelled and recorded in history',
      cancelledTask: {
        customerName: taskToCancel.CustomerName,
        villa: taskToCancel.Villa,
        carPlate: taskToCancel.CarPlate,
        day: taskToCancel.Day,
        time: taskToCancel.Time,
        cancelledDate: cancelledDate
      }
    });
    
  } catch (error) {
    console.error('[CANCEL] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const completeAllTasks = async (req, res) => {
  try {
    const { tasks } = req.body;
    
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No tasks provided' 
      });
    }
    
    // Check for already completed tasks
    const allHistory = await getAllHistory();
    const now = new Date();
    const historyRecords = [];
    const skippedTasks = [];
    
    // Filter out already completed tasks
    tasks.forEach(task => {
      const washDateFormatted = task.actualWashDate ? formatDateForHistory(task.actualWashDate) : formatDateForHistory(now.toISOString().split('T')[0]);
      
      const existingRecord = allHistory.find(record => 
        record.CustomerID === task.customerID &&
        record.CarPlate === (task.carPlate || '') &&
        record.WashDate === washDateFormatted
      );
      
      if (existingRecord) {
        skippedTasks.push(`${task.customerID} - ${task.carPlate || 'No plate'}`);
        return;
      }
      
      const historyRecord = {
        WashID: `${task.customerID}-${task.carPlate}-${now.getTime()}-${Math.random()}`,
        CustomerID: task.customerID,
        CarPlate: task.carPlate || '',
        WashDate: washDateFormatted,
        PackageType: task.packageType || '',
        Villa: task.villa || '',
        WashTypePerformed: task.washType,
        VisitNumberInWeek: 1,
        WeekInCycle: 1,
        Status: 'Completed',
        WorkerName: task.workerName || ''
      };
      historyRecords.push(historyRecord);
    });
    
    // Add only new history records
    for (const record of historyRecords) {
      await addHistoryRecord(record);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Remove completed tasks from scheduled tasks
    const existingTasks = await getScheduledTasks();
    const completedTaskIds = tasks.map(task => task.id);
    const remainingTasks = existingTasks.filter(task => 
      !completedTaskIds.includes(`${task.CustomerID}-${task.Day}-${task.Time}-${task.CarPlate}`)
    );
    
    // Update scheduled tasks sheet
    const updatedSchedule = remainingTasks.map(task => ({
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
    
    await clearAndWriteSheet('ScheduledTasks', updatedSchedule);
    
    const message = skippedTasks.length > 0 
      ? `Completed ${historyRecords.length} tasks. Skipped ${skippedTasks.length} already completed tasks: ${skippedTasks.join(', ')}`
      : `Successfully completed ${historyRecords.length} tasks`;
    
    res.json({
      success: true,
      message,
      completedCount: historyRecords.length,
      skippedCount: skippedTasks.length
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Helper function to format date for history (DD-MMM-YYYY format)
function formatDateForHistory(dateStr) {
  const date = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day}-${month}-${year}`;
}

const getDebugStatus = async (req, res) => {
  try {
    const [scheduledTasks, allHistory] = await Promise.all([
      getScheduledTasks(),
      getAllHistory()
    ]);
    
    // Get day name and week offset from query parameters
    const requestedDay = req.query.day;
    const weekOffset = parseInt(req.query.weekOffset) || 0;
    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = requestedDay || dayNames[today.getDay()];
    
    // Calculate the actual date for the requested day and week
    const targetDate = new Date(today);
    const currentDay = today.getDay();
    const selectedDayIndex = dayNames.indexOf(todayName);
    targetDate.setDate(today.getDate() - currentDay + selectedDayIndex + (weekOffset * 7));
    const targetDateString = targetDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    const targetDateFormatted = formatDateForHistory(targetDate.toISOString().split('T')[0]);
    
    // Filter tasks for the requested day
    const dayTasks = scheduledTasks.filter(task => task.Day === todayName);
    
    // Check history for this date
    const historyForDate = allHistory.filter(record => record.WashDate === targetDateFormatted);
    const completedTasks = historyForDate.filter(record => record.Status === 'Completed');
    const cancelledTasks = historyForDate.filter(record => record.Status === 'Cancelled');
    
    // Find remaining tasks (still in schedule - these should be removed)
    // If tasks are completed but still in schedule, they are "stuck"
    const remainingTasks = dayTasks; // All scheduled tasks are potentially stuck if they should have been removed
    
    // Check which ones are actually completed/cancelled in history
    const tasksWithStatus = dayTasks.map(task => {
      const historyRecord = historyForDate.find(record => 
        record.CustomerID === task.CustomerID &&
        record.CarPlate === (task.CarPlate || '')
      );
      return {
        ...task,
        isInHistory: !!historyRecord,
        historyStatus: historyRecord?.Status || null
      };
    });
    
    // Tasks that are in history but still in schedule are "stuck"
    const stuckTasks = tasksWithStatus.filter(task => task.isInHistory);
    const trulyRemainingTasks = tasksWithStatus.filter(task => !task.isInHistory);
    
    // Create detailed breakdown
    const details = [
      '📋 Scheduled Tasks for ' + todayName + ' (' + dayTasks.length + ' total):',
      ...dayTasks.map(task => {
        const historyRecord = historyForDate.find(record => 
          record.CustomerID === task.CustomerID &&
          record.CarPlate === (task.CarPlate || '')
        );
        const status = historyRecord ? `[${historyRecord.Status}]` : '[NOT IN HISTORY]';
        return `  • ${task.CustomerName} (Villa ${task.Villa}) - ${task.CarPlate || 'No plate'} - ${task.Time} ${status}`;
      }),
      '',
      '⚠️ STUCK TASKS (Completed but still in schedule):',
      ...stuckTasks.map(task => `  • ${task.CustomerName} (Villa ${task.Villa}) - ${task.CarPlate || 'No plate'} - ${task.Time} [${task.historyStatus}]`),
      '',
      '⏳ NOT YET COMPLETED:',
      ...trulyRemainingTasks.map(task => `  • ${task.CustomerName} (Villa ${task.Villa}) - ${task.CarPlate || 'No plate'} - ${task.Time}`),
      '',
      '📊 SUMMARY:',
      `  • Total in Schedule: ${dayTasks.length}`,
      `  • Completed in History: ${completedTasks.length}`,
      `  • Cancelled in History: ${cancelledTasks.length}`,
      `  • Stuck (need cleanup): ${stuckTasks.length}`,
      `  • Truly Remaining: ${trulyRemainingTasks.length}`
    ].join('\n');
    
    res.json({
      success: true,
      day: todayName,
      weekOffset: weekOffset,
      targetDate: targetDateString,
      targetDateFormatted: targetDateFormatted,
      scheduledCount: dayTasks.length,
      completedCount: completedTasks.length,
      cancelledCount: cancelledTasks.length,
      remainingCount: trulyRemainingTasks.length,
      stuckCount: stuckTasks.length,
      totalInSchedule: dayTasks.length,
      details: details,
      scheduledTasks: dayTasks,
      historyRecords: historyForDate,
      remainingTasks: trulyRemainingTasks,
      stuckTasks: stuckTasks,
      tasksWithStatus: tasksWithStatus
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const forceCleanup = async (req, res) => {
  try {
    const { day, weekOffset } = req.body;
    
    if (!day) {
      return res.status(400).json({ success: false, error: 'Day is required' });
    }
    
    const [scheduledTasks, allHistory] = await Promise.all([
      getScheduledTasks(),
      getAllHistory()
    ]);
    
    // Calculate target date
    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = today.getDay();
    const selectedDayIndex = dayNames.indexOf(day);
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - currentDay + selectedDayIndex + ((weekOffset || 0) * 7));
    const targetDateFormatted = formatDateForHistory(targetDate.toISOString().split('T')[0]);
    
    // Find tasks for the specified day
    const dayTasks = scheduledTasks.filter(task => task.Day === day);
    
    // Find tasks that are in history but still in schedule (these are the stuck ones)
    const historyForDate = allHistory.filter(record => record.WashDate === targetDateFormatted);
    const stuckTasks = dayTasks.filter(task => {
      const isInHistory = historyForDate.some(record => 
        record.CustomerID === task.CustomerID &&
        record.CarPlate === (task.CarPlate || '')
      );
      return isInHistory; // These are completed but still in schedule = stuck
    });
    
    console.log(`[FORCE-CLEANUP] Found ${stuckTasks.length} stuck tasks for ${day} (${targetDateFormatted})`);
    
    let cleanedCount = 0;
    const now = new Date();
    
    // Remove stuck tasks from schedule (they're already in history)
    console.log(`[FORCE-CLEANUP] Found ${stuckTasks.length} stuck tasks (completed but still in schedule)`);
    
    if (stuckTasks.length > 0) {
      cleanedCount = stuckTasks.length;
      
      // Remove the stuck tasks from scheduled tasks
      const stuckTaskIds = stuckTasks.map(task => `${task.CustomerID}-${task.Day}-${task.Time}-${task.CarPlate}`);
      const remainingTasks = scheduledTasks.filter(task => 
        !stuckTaskIds.includes(`${task.CustomerID}-${task.Day}-${task.Time}-${task.CarPlate}`)
      );
      
      // Update scheduled tasks sheet
      const updatedSchedule = remainingTasks.map(task => ({
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
      
      await clearAndWriteSheet('ScheduledTasks', updatedSchedule);
      
      console.log(`[FORCE-CLEANUP] Removed ${cleanedCount} stuck tasks from schedule`);
    }
    

    
    console.log(`[FORCE-CLEANUP] Completed cleanup: ${cleanedCount} tasks cleaned`);
    
    res.json({
      success: true,
      message: `Force cleanup completed for ${day} (${targetDateFormatted})`,
      day: day,
      targetDate: targetDateFormatted,
      cleanedCount: cleanedCount,
      skippedCount: dayTasks.length - cleanedCount,
      totalTasksForDay: dayTasks.length,
      stuckTasks: stuckTasks.map(task => `${task.CustomerName} - ${task.CarPlate || 'No plate'}`)
    });
    
  } catch (error) {
    console.error('[FORCE-CLEANUP] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { getTodayTasks, completeTask, cancelTask, getAllTasks, completeAllTasks, getDebugStatus, forceCleanup };