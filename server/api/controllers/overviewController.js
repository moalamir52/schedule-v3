const db = require('../../services/databaseService');

const getScheduleOverview = async (req, res) => {
  try {
    // Fetch active workers to determine total capacity
    const workers = await db.getWorkers();
    const totalCapacity = workers.filter(worker => worker.Status === 'Active').length;
    
    // Fetch current schedule from database
    const currentSchedule = await db.getScheduledTasks();
    
    // Initialize data structures
    const days = ['Saturday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const timeSlots = [
      '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
      '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'
    ];
    
    // Initialize counts object
    const counts = {};
    days.forEach(day => {
      counts[day] = {};
      timeSlots.forEach(time => {
        counts[day][time] = 0;
      });
    });
    
    // Count unique workers per time slot (not cars)
    const workerSlots = new Set();
    
    currentSchedule.forEach(task => {
      const day = task.Day || task.day;
      const time = task.Time || task.time;
      const workerId = task.WorkerID || task.workerId;
      
      if (counts[day] && counts[day][time] !== undefined && workerId) {
        const slotKey = `${day}-${time}-${workerId}`;
        if (!workerSlots.has(slotKey)) {
          workerSlots.add(slotKey);
          counts[day][time]++;
        }
      }
    });
    
    // Generate final overview
    const overview = {};
    days.forEach(day => {
      overview[day] = {};
      timeSlots.forEach(time => {
        const bookedCount = counts[day][time];
        
        if (bookedCount >= totalCapacity) {
          overview[day][time] = { status: 'Full' };
        } else if (bookedCount > 0) {
          const slotsLeft = totalCapacity - bookedCount;
          overview[day][time] = { 
            status: `${slotsLeft} Slot${slotsLeft > 1 ? 's' : ''} Left`, 
            slotsLeft 
          };
        } else {
          overview[day][time] = { 
            status: 'Available', 
            slotsLeft: totalCapacity 
          };
        }
      });
    });
    
    res.json(overview);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Helper function to expand abbreviated day names
function expandDayName(shortDay) {
  const dayMap = {
    'Sat': 'Saturday',
    'Mon': 'Monday', 
    'Tue': 'Tuesday',
    'Wed': 'Wednesday',
    'Thu': 'Thursday',
    'Thurs': 'Thursday',
    'Fri': 'Friday'
  };
  return dayMap[shortDay] || shortDay;
}

// Helper function to parse Days field into array of full day names
function parseDaysField(daysField) {
  if (!daysField) return [];
  
  const dayMap = {
    'Sat': 'Saturday',
    'Mon': 'Monday',
    'Tue': 'Tuesday', 
    'Wed': 'Wednesday',
    'Thu': 'Thursday',
    'Thurs': 'Thursday',
    'Fri': 'Friday'
  };
  
  // Split by hyphen to get individual days
  const dayParts = daysField.split('-').map(d => d.trim());
  const days = [];
  
  dayParts.forEach(dayPart => {
    const fullDay = expandDayName(dayPart);
    if (fullDay && !days.includes(fullDay)) {
      days.push(fullDay);
    }
  });
  
  return days;
}

module.exports = { getScheduleOverview };