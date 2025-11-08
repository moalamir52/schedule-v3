const db = require('./services/databaseService');

async function checkDatabaseStructure() {
  try {
    console.log('='.repeat(50));
    console.log('📊 DATABASE STRUCTURE CHECK');
    console.log('='.repeat(50));
    
    // Check wash_history table structure
    const historyColumns = await db.all("PRAGMA table_info(wash_history)");
    console.log('\n🗂️ WASH_HISTORY TABLE COLUMNS:');
    historyColumns.forEach(col => {
      console.log(`  - ${col.name} (${col.type})`);
    });
    
    // Check ScheduledTasks table structure  
    const scheduleColumns = await db.all("PRAGMA table_info(ScheduledTasks)");
    console.log('\n📅 SCHEDULEDTASKS TABLE COLUMNS:');
    scheduleColumns.forEach(col => {
      console.log(`  - ${col.name} (${col.type})`);
    });
    
    // Sample wash_history data
    const sampleHistory = await db.all("SELECT * FROM wash_history LIMIT 3");
    console.log('\n📋 SAMPLE WASH_HISTORY DATA:');
    if (sampleHistory.length > 0) {
      console.log('Columns:', Object.keys(sampleHistory[0]));
      sampleHistory.forEach((record, i) => {
        console.log(`Record ${i + 1}:`, record);
      });
    } else {
      console.log('No data found in wash_history table');
    }
    
    // Sample ScheduledTasks data
    const sampleSchedule = await db.all("SELECT * FROM ScheduledTasks LIMIT 3");
    console.log('\n📋 SAMPLE SCHEDULEDTASKS DATA:');
    if (sampleSchedule.length > 0) {
      console.log('Columns:', Object.keys(sampleSchedule[0]));
      sampleSchedule.forEach((record, i) => {
        console.log(`Record ${i + 1}:`, record);
      });
    } else {
      console.log('No data found in ScheduledTasks table');
    }
    
    console.log('\n' + '='.repeat(50));
    
  } catch (error) {
    console.error('❌ Error checking database structure:', error);
  } finally {
    process.exit(0);
  }
}

checkDatabaseStructure();