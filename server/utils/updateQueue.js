// Queue system for batching real-time updates
class UpdateQueue {
  constructor(flushInterval = 5000) {
    this.queue = new Map();
    this.timer = null;
    this.flushInterval = flushInterval;
  }

  addUpdate(taskId, updates) {
    // Merge with existing updates for same task
    if (this.queue.has(taskId)) {
      this.queue.set(taskId, { ...this.queue.get(taskId), ...updates });
    } else {
      this.queue.set(taskId, updates);
    }

    // Start flush timer if not running
    if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.flushInterval);
    }
  }

  async flush() {
    if (this.queue.size === 0) return;

    const updates = Array.from(this.queue.entries());
    this.queue.clear();
    this.timer = null;

    // Batch update all tasks at once
    try {
      await this.batchUpdate(updates);
      console.log(`[QUEUE] Flushed ${updates.length} updates`);
    } catch (error) {
      console.error('[QUEUE] Flush failed:', error.message);
      // Re-queue failed updates
      updates.forEach(([taskId, update]) => this.addUpdate(taskId, update));
    }
  }

  async batchUpdate(updates) {
    const db = require('../services/databaseService');
    
    // Get current schedule
    const currentTasks = await getScheduledTasks();
    
    // Apply all updates
    updates.forEach(([taskId, update]) => {
      const taskIndex = currentTasks.findIndex(task => 
        `${task.CustomerID}-${task.Day}-${task.CarPlate}` === taskId
      );
      
      if (taskIndex !== -1) {
        Object.assign(currentTasks[taskIndex], update);
      }
    });
    
    // Write back to sheet once
    await clearAndWriteSheet('ScheduledTasks', currentTasks);
  }
}

const updateQueue = new UpdateQueue();
module.exports = { UpdateQueue, updateQueue };