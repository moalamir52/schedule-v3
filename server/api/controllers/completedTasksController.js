const db = require('../../services/databaseService');

// Remove completed tasks from schedule immediately
const getCompletedTasks = async (req, res) => {
  try {
    const history = await db.getAllHistory();
    const completedTasks = history.filter(record => 
      record.Status === 'Completed' || record.Status === 'Cancelled'
    );
    
    res.json({
      success: true,
      completedTasks: completedTasks,
      totalCount: completedTasks.length,
      message: `Found ${completedTasks.length} completed tasks`
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const removeCompletedTasks = async (req, res) => {
  try {
    // Get current schedule and history
    const [scheduledTasks, allHistory] = await Promise.all([
      db.getScheduledTasks(),
      db.getAllHistory()
    ]);
    
    // Debug matching
    debugTaskMatching(scheduledTasks, allHistory);
    
    // Filter out completed tasks
    const activeTasks = scheduledTasks.filter(task => {
      if (!task.AppointmentDate) return true; // Keep tasks without date
      
      const taskDate = new Date(task.AppointmentDate);
      const isCompleted = allHistory.some(record => {
        // Match by CustomerID, CarPlate, and Date
        const customerMatch = record.CustomerID === task.CustomerID;
        const carMatch = record.CarPlate === (task.CarPlate || '');
        const dateMatch = parseHistoryDate(record.WashDate).toDateString() === taskDate.toDateString();
        const statusMatch = record.Status === 'Completed' || record.Status === 'Cancelled';
        
        return customerMatch && carMatch && dateMatch && statusMatch;
      });
      
      if (isCompleted) {
        console.log(`Task completed: ${task.CustomerID} - ${task.CarPlate}`);
        return false;
      }
      return true;
    });
    
    const removedCount = scheduledTasks.length - activeTasks.length;
    if (removedCount > 0) {
      // Update database with active tasks only
      const formattedTasks = activeTasks.map(task => ({
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
      
      await db.clearAndWriteSchedule(formattedTasks);
      }
    
    res.json({
      success: true,
      message: `Removed ${removedCount} completed tasks from schedule`,
      removedCount,
      remainingTasks: activeTasks.length
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Helper function to parse history dates (DD-MMM-YYYY format)
function parseHistoryDate(dateStr) {
  if (!dateStr) return new Date(0);
  
  // Handle DD-MMM-YYYY format (e.g., 13-Oct-2025)
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

// Debug function to check matching
function debugTaskMatching(scheduledTasks, allHistory) {
  if (scheduledTasks.length > 0 && allHistory.length > 0) {
    const sampleTask = scheduledTasks[0];
    const sampleHistory = allHistory[0];
    
    console.log('Sample task:', sampleTask.CustomerID, sampleTask.CarPlate);
  }
}

module.exports = {
  getCompletedTasks,
  removeCompletedTasks,
  debugTaskMatching
};