const db = require('./services/databaseService');

async function clearAllScheduleData() {
  try {
    console.log('[CLEAR-SCHEDULE] Starting to clear all schedule data...');
    
    // Clear the schedule database
    await db.clearAndWriteSchedule([]);
    
    console.log('[CLEAR-SCHEDULE] All schedule data cleared successfully');
    return { success: true, message: 'All schedule data cleared successfully' };
  } catch (error) {
    console.error('[CLEAR-SCHEDULE] Error:', error);
    return { success: false, error: error.message };
  }
}

// Run if called directly
if (require.main === module) {
  clearAllScheduleData().then(result => {
    console.log(result);
    process.exit(result.success ? 0 : 1);
  });
}

module.exports = { clearAllScheduleData };