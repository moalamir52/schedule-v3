const cron = require('node-cron');
const { autoAssignSchedule } = require('../api/controllers/assignmentController');

class CronService {
  constructor() {
    this.cronJob = null;
    this.settings = {
      enabled: false,
      day: 4, // Thursday (0=Sunday, 4=Thursday)
      hour: 22, // 10 PM
      minute: 0
    };
  }

  start() {
    if (this.cronJob) {
      this.cronJob.stop();
    }

    if (!this.settings.enabled) {
      return;
    }

    const cronExpression = `${this.settings.minute} ${this.settings.hour} * * ${this.settings.day}`;
    
    this.cronJob = cron.schedule(cronExpression, async () => {
      try {
        // Create mock req/res for the controller
        const mockReq = { params: { weekOffset: '1' } };
        const mockRes = {
          json: (data) => {},
          status: (code) => ({ json: (data) => {} })
        };
        
        await autoAssignSchedule(mockReq, mockRes);
      } catch (error) {
        // Silent error handling
      }
    }, {
      scheduled: true,
      timezone: "Asia/Dubai"
    });

  }

  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.start(); // Restart with new settings
  }

  getSettings() {
    return {
      ...this.settings,
      nextRun: this.getNextRunTime(),
      description: this.getCronDescription()
    };
  }

  getCronDescription() {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[this.settings.day];
    const hour = this.settings.hour > 12 ? this.settings.hour - 12 : this.settings.hour;
    const ampm = this.settings.hour >= 12 ? 'PM' : 'AM';
    const minute = this.settings.minute.toString().padStart(2, '0');
    
    return `${dayName} at ${hour}:${minute} ${ampm}`;
  }

  getNextRunTime() {
    if (!this.settings.enabled || !this.cronJob) return null;
    
    const now = new Date();
    const nextRun = new Date();
    
    // Calculate next occurrence
    const daysUntilNext = (this.settings.day - now.getDay() + 7) % 7;
    nextRun.setDate(now.getDate() + (daysUntilNext === 0 ? 7 : daysUntilNext));
    nextRun.setHours(this.settings.hour, this.settings.minute, 0, 0);
    
    // If it's the same day but time has passed, add 7 days
    if (daysUntilNext === 0 && now.getTime() > nextRun.getTime()) {
      nextRun.setDate(nextRun.getDate() + 7);
    }
    
    return nextRun.toISOString();
  }
}

// Export singleton instance
const cronService = new CronService();
module.exports = cronService;