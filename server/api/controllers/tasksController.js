const { getScheduledTasks, addHistoryRecord, getCustomers } = require('../../services/googleSheetsService');

const getAllTasks = async (req, res) => {
  console.log('[ALL TASKS] ==> Getting all scheduled tasks...');
  
  try {
    const scheduledTasks = await getScheduledTasks();
    
    console.log(`[ALL TASKS] Found ${scheduledTasks.length} total tasks`);
    
    res.json({
      success: true,
      message: `Found ${scheduledTasks.length} total tasks`,
      tasks: scheduledTasks
    });
    
  } catch (error) {
    console.error('[ALL TASKS] ERROR:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getTodayTasks = async (req, res) => {
  console.log('[DAILY TASKS] ==> Getting tasks...');
  
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
    
    console.log(`[DAILY TASKS] Requested day: ${todayName} (Week offset: ${weekOffset})`);
    console.log(`[DAILY TASKS] Target date: ${targetDateString}`);
    console.log(`[DAILY TASKS] Total scheduled tasks: ${scheduledTasks.length}`);
    console.log(`[DAILY TASKS] Available tasks:`, scheduledTasks.map(t => ({ Day: t.Day, Customer: t.CustomerName })));
    console.log(`[DAILY TASKS] Found ${todayTasks.length} tasks for ${todayName}`);
    
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
    console.error('[DAILY TASKS] ERROR:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const completeTask = async (req, res) => {
  console.log('[COMPLETE TASK] ==> Completing task...');
  
  try {
    const { taskId, customerID, carPlate, washType, villa, workerName, packageType, actualWashDate } = req.body;
    
    console.log('[COMPLETE TASK] Request data:', { taskId, customerID, carPlate, washType, villa, workerName, packageType });
    
    if (!taskId || !customerID || !washType) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: taskId, customerID, washType' 
      });
    }
    
    // Create history record with all required fields
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
    
    console.log('[COMPLETE TASK] History record:', historyRecord);
    
    // Save to wash_history sheet
    try {
      await addHistoryRecord(historyRecord);
      console.log('[COMPLETE TASK] ==> History record saved successfully');
    } catch (sheetError) {
      console.error('[COMPLETE TASK] Sheet save error details:', sheetError);
      throw new Error(`Failed to save to wash_history: ${sheetError.message}`);
    }
    
    console.log(`[COMPLETE TASK] ==> Task completed: ${customerID} - ${carPlate} - ${washType}`);
    
    res.json({
      success: true,
      message: 'Task completed successfully',
      historyRecord
    });
    
  } catch (error) {
    console.error('[COMPLETE TASK] ERROR:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};



module.exports = { getTodayTasks, completeTask, getAllTasks };