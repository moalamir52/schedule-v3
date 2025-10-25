const { buildWeeklySchedule } = require('../../services/logicService');
const { scheduleCache } = require('../../utils/scheduleCache');

async function getWeeklySchedule(req, res) {
  try {
    // Try cache first (instant)
    let schedule = scheduleCache.getSchedule();
    
    if (!schedule) {
      // Cache miss - load from API
      schedule = await scheduleCache.refresh();
    }
    
    res.status(200).json({
      schedule,
      hasPendingChanges: scheduleCache.hasPendingChanges(),
      lastSync: scheduleCache.lastSync
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

// Manual refresh endpoint
async function refreshSchedule(req, res) {
  try {
    const schedule = await scheduleCache.refresh();
    res.status(200).json({ schedule, message: 'Schedule refreshed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to refresh schedule' });
  }
}

// Save pending changes
async function saveSchedule(req, res) {
  try {
    await scheduleCache.save();
    res.status(200).json({ message: 'Schedule saved successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save schedule' });
  }
}

// Update task (cache only)
async function updateTask(req, res) {
  try {
    const { taskId } = req.params;
    const updates = req.body;
    
    scheduleCache.updateTask(taskId, updates);
    
    res.status(200).json({ 
      message: 'Task updated in cache',
      hasPendingChanges: true
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update task' });
  }
}

module.exports = {
  getWeeklySchedule,
  refreshSchedule,
  saveSchedule,
  updateTask
};