// Schedule cache with manual refresh
class ScheduleCache {
  constructor() {
    this.scheduleData = null;
    this.pendingChanges = new Map();
    this.lastSync = null;
  }

  // Get schedule from cache (instant)
  getSchedule() {
    if (!this.scheduleData) return null;
    
    // Apply pending changes to cached data
    const schedule = JSON.parse(JSON.stringify(this.scheduleData));
    this.pendingChanges.forEach((changes, taskId) => {
      const task = schedule.find(t => this.getTaskId(t) === taskId);
      if (task) Object.assign(task, changes);
    });
    
    return schedule;
  }

  // Update cache instantly (no API call)
  updateTask(taskId, changes) {
    this.pendingChanges.set(taskId, {
      ...this.pendingChanges.get(taskId),
      ...changes
    });
  }

  // Load fresh data from API
  async refresh() {
    const { getScheduledTasks } = require('../services/googleSheetsService');
    this.scheduleData = await getScheduledTasks();
    this.pendingChanges.clear();
    this.lastSync = new Date();
    return this.scheduleData;
  }

  // Save all pending changes to API
  async save() {
    if (this.pendingChanges.size === 0) return;
    
    const { clearAndWriteSheet } = require('../services/googleSheetsService');
    const updatedSchedule = this.getSchedule();
    
    await clearAndWriteSheet('ScheduledTasks', updatedSchedule);
    this.scheduleData = updatedSchedule;
    this.pendingChanges.clear();
    this.lastSync = new Date();
  }

  getTaskId(task) {
    return `${task.CustomerID}-${task.Day}-${task.CarPlate}`;
  }

  hasPendingChanges() {
    return this.pendingChanges.size > 0;
  }
}

const scheduleCache = new ScheduleCache();
module.exports = { ScheduleCache, scheduleCache };