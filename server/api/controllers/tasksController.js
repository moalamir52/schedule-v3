const { getScheduledTasks, addHistoryRecord, getCustomers, clearAndWriteSheet, getAllHistory } = require('../../services/googleSheetsService');

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

module.exports = { getTodayTasks, completeTask, getAllTasks, completeAllTasks };