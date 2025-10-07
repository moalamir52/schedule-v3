const { getScheduledTasks, addHistoryRecord, getCustomers, clearAndWriteSheet } = require('../../services/googleSheetsService');

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
    const scheduledTasks = await getScheduledTasks();
    
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
    
    // Filter tasks for today only
    const todayTasks = scheduledTasks.filter(task => task.Day === todayName);
    
    // Format tasks for frontend
    const formattedTasks = todayTasks.map(task => ({
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
      message: `Found ${todayTasks.length} tasks for ${todayName} (Week ${weekOffset})`,
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
    
    // Create history record
    const now = new Date();
    const historyRecord = {
      WashID: `${customerID}-${carPlate}-${now.getTime()}`,
      CustomerID: customerID,
      CarPlate: carPlate || '',
      WashDate: actualWashDate || now.toISOString().split('T')[0],
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
    
    // Remove completed task from scheduled tasks
    const existingTasks = await getScheduledTasks();
    const remainingTasks = existingTasks.filter(task => 
      `${task.CustomerID}-${task.Day}-${task.Time}-${task.CarPlate}` !== taskId
    );
    
    // Update scheduled tasks sheet
    const updatedSchedule = remainingTasks.map(task => ({
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
      message: 'Task completed successfully',
      historyRecord
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};



module.exports = { getTodayTasks, completeTask, getAllTasks };