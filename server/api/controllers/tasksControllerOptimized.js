const db = require('../../services/databaseService');
const { getAllHistory } = require('../../services/googleSheetsService');

// Helper functions
const getScheduledTasks = () => db.getScheduledTasks();
const addHistoryRecord = (record) => db.addHistoryRecord(record);

const getTodayTasks = async (req, res) => {
  try {
    const [scheduledTasks, allHistory] = await Promise.all([
      getScheduledTasks(),
      getAllHistory()
    ]);
    
    const requestedDay = req.query.day;
    const weekOffset = parseInt(req.query.weekOffset) || 0;
    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = requestedDay || dayNames[today.getDay()];
    
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
    
    const todayTasks = scheduledTasks.filter(task => task.Day === todayName);
    
    const incompleteTasks = todayTasks.filter(task => {
      const isCompleted = allHistory.some(record => 
        record.CustomerID === task.CustomerID &&
        record.CarPlate === (task.CarPlate || '') &&
        record.WashDate === targetDateFormatted
      );
      return !isCompleted;
    });
    
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
    
    // Save to wash_history
    await addHistoryRecord(historyRecord);
    
    // Use optimized task completion - direct delete
    console.log(`[COMPLETE] Using optimized deletion for task: ${taskId}`);
    
    try {
      const success = await db.completeTaskOptimized(taskId);
      if (!success) {
        console.log('[COMPLETE] Optimized completion failed, task may not exist');
      }
    } catch (error) {
      console.error('[COMPLETE] Error in optimized task completion:', error);
      // Continue anyway - the history record was saved
    }
    
    res.json({
      success: true,
      message: 'Task completed successfully',
      historyRecord
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

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
    
    // Get current scheduled tasks to find the task details
    const existingTasks = await getScheduledTasks();
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
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - currentDay + targetDayIndex);
    const cancelledDate = formatDateForHistory(targetDate.toISOString().split('T')[0]);
    
    // Add cancellation record to history
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
    
    await addHistoryRecord(cancellationRecord);
    console.log(`[CANCEL] Added cancellation record to history: ${cancelledDate}`);
    
    // Use optimized task deletion
    console.log(`[CANCEL] Using optimized deletion for task: ${taskId}`);
    
    try {
      const success = await db.completeTaskOptimized(taskId);
      if (!success) {
        console.log('[CANCEL] Optimized deletion failed, task may not exist');
      }
    } catch (error) {
      console.error('[CANCEL] Error in optimized task deletion:', error);
      // Continue anyway - the cancellation record was saved
    }
    
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
    
    // Add history records
    for (const record of historyRecords) {
      await addHistoryRecord(record);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Use batch deletion for better performance
    const completedTaskIds = tasks.map(task => task.id);
    console.log(`[COMPLETE-ALL] Using batch deletion for ${completedTaskIds.length} tasks`);
    
    try {
      await db.batchDeleteTasks(completedTaskIds);
      console.log(`[COMPLETE-ALL] Successfully batch deleted ${completedTaskIds.length} tasks`);
    } catch (error) {
      console.error('[COMPLETE-ALL] Batch deletion failed:', error);
      // Continue anyway - the history records were saved
    }
    
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
    
    // Find tasks that are in history but still in schedule (stuck tasks)
    const historyForDate = allHistory.filter(record => record.WashDate === targetDateFormatted);
    const stuckTasks = dayTasks.filter(task => {
      const isInHistory = historyForDate.some(record => 
        record.CustomerID === task.CustomerID &&
        record.CarPlate === (task.CarPlate || '')
      );
      return isInHistory;
    });
    
    console.log(`[FORCE-CLEANUP] Found ${stuckTasks.length} stuck tasks for ${day} (${targetDateFormatted})`);
    
    let cleanedCount = 0;
    
    if (stuckTasks.length > 0) {
      cleanedCount = stuckTasks.length;
      
      // Use batch deletion for stuck tasks
      const stuckTaskIds = stuckTasks.map(task => `${task.CustomerID}-${task.Day}-${task.Time}-${task.CarPlate}`);
      console.log(`[FORCE-CLEANUP] Using batch deletion for ${stuckTaskIds.length} stuck tasks`);
      
      try {
        await db.batchDeleteTasks(stuckTaskIds);
        console.log(`[FORCE-CLEANUP] Successfully batch deleted ${stuckTaskIds.length} stuck tasks`);
      } catch (error) {
        console.error('[FORCE-CLEANUP] Batch deletion failed:', error);
        cleanedCount = 0;
      }
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

const getDebugStatus = async (req, res) => {
  try {
    const [scheduledTasks, allHistory] = await Promise.all([
      getScheduledTasks(),
      getAllHistory()
    ]);
    
    const requestedDay = req.query.day;
    const weekOffset = parseInt(req.query.weekOffset) || 0;
    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = requestedDay || dayNames[today.getDay()];
    
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
    
    const dayTasks = scheduledTasks.filter(task => task.Day === todayName);
    
    const historyForDate = allHistory.filter(record => record.WashDate === targetDateFormatted);
    const completedTasks = historyForDate.filter(record => record.Status === 'Completed');
    const cancelledTasks = historyForDate.filter(record => record.Status === 'Cancelled');
    
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
    
    const stuckTasks = tasksWithStatus.filter(task => task.isInHistory);
    const trulyRemainingTasks = tasksWithStatus.filter(task => !task.isInHistory);
    
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

module.exports = { getTodayTasks, completeTask, cancelTask, completeAllTasks, getDebugStatus, forceCleanup };