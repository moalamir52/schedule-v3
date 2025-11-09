// logicService.js
// Use database service instead of Google Sheets

async function buildWeeklySchedule(weekOffset = 0) {
  try {
    console.log('[BUILD-SCHEDULE] Starting weekly schedule generation...');
    
    // Get all data from database
    const db = require('./databaseService');
    const [allCustomers, allHistory, allWorkers] = await Promise.all([
      db.getCustomers(),
      db.getAllHistory(),
      db.getWorkers()
    ]);
    
    console.log(`[BUILD-SCHEDULE] Retrieved ${allCustomers.length} customers, ${allHistory.length} history records, ${allWorkers.length} workers`);
    
    const activeCustomers = allCustomers.filter(customer => customer.Status === 'Active');
    const activeWorkers = allWorkers.filter(worker => worker.Status === 'Active');
    const schedule = [];
    
    console.log(`[BUILD-SCHEDULE] Active customers: ${activeCustomers.length}, Active workers: ${activeWorkers.length}`);
    
    if (activeCustomers.length === 0) {
      console.warn('[BUILD-SCHEDULE] No active customers found!');
      return [];
    }
    
    if (activeWorkers.length === 0) {
      console.warn('[BUILD-SCHEDULE] No active workers found!');
      return [];
    }
    
    // Track worker assignments to avoid conflicts
    const workerSchedule = {}; // {workerId: {day-time: {CustomerID, CustomerName}}}
    let customerIndex = 0; // Track customer processing order
    
    for (const customer of activeCustomers) {
      customerIndex++;
      try {
        // Safety checks for required fields
        if (!customer.Washman_Package || customer.Washman_Package.trim() === '') {
          console.warn(`[BUILD-SCHEDULE] Skipping customer '${customer.Name}' (${customer.CustomerID}) - no package`);
          continue;
        }
        
        if (!customer.Days || (!customer.Time && !customer.Notes)) {
          console.warn(`[BUILD-SCHEDULE] Skipping customer '${customer.Name}' (${customer.CustomerID}) - missing Days or Time/Notes`);
          continue;
        }
        
        if (!customer.CarPlates) {
          console.warn(`[BUILD-SCHEDULE] Skipping customer '${customer.Name}' (${customer.CustomerID}) - no car plates`);
          continue;
        }
        
        // Parse car plates into array
        const carPlates = customer.CarPlates.split(',').map(plate => plate.trim()).filter(plate => plate);
        
        if (carPlates.length === 0) {
          console.warn(`[BUILD-SCHEDULE] Skipping customer '${customer.Name}' - no valid car plates`);
          continue;
        }
        
        // Generate wash schedules for ALL cars first
        const allWashSchedules = [];
        
        for (const carPlate of carPlates) {
          const history = allHistory
            .filter(record => record.CarPlate === carPlate)
            .sort((a, b) => new Date(b.WashDate) - new Date(a.WashDate));
          
          const washSchedule = calculateWashSchedule(customer, carPlate, carPlates, history, allHistory, weekOffset);
          allWashSchedules.push(...washSchedule);
        }
        
        // Process each wash schedule individually to assign workers
        console.log(`[WORKER-SEARCH] Customer ${customerIndex}: ${customer.Name} processing ${allWashSchedules.length} tasks`);
        
        // Group tasks by day-time to assign same worker for same time slots
        const timeGroups = {};
        allWashSchedules.forEach(wash => {
            if (wash.washTime) {
                // Extract actual time from complex time strings
                const actualTimes = parseTimeSlots(wash.washTime);
                actualTimes.forEach(actualTime => {
                    const timeKey = `${wash.washDay}-${actualTime}`;
                    if (!timeGroups[timeKey]) {
                        timeGroups[timeKey] = [];
                    }
                    // Create a copy of wash with the actual time
                    timeGroups[timeKey].push({
                        ...wash,
                        washTime: actualTime
                    });
                });
            }
        });
        
        // Assign worker for each time group
        Object.keys(timeGroups).forEach(timeKey => {
            const [day, ...timeParts] = timeKey.split('-');
            const time = timeParts.join('-'); // Handle times with dashes
            const tasks = timeGroups[timeKey];
            
            // Find worker but don't reserve yet
            const groupWorker = findAvailableWorker(activeWorkers, workerSchedule, day, time, false);
            
            // Skip this time group if no worker is available
            if (!groupWorker) {
                console.warn(`[NO-WORKER] Skipping customer ${customer.Name} at ${day} ${time} - no available workers`);
                return;
            }
            
            // Now reserve the worker for this time slot
            const timeSlots = parseTimeSlots(time);
            if (!workerSchedule[groupWorker.WorkerID]) {
                workerSchedule[groupWorker.WorkerID] = {};
            }
            
            for (const timeSlot of timeSlots) {
                const slotKey = `${day}-${timeSlot}`;
                workerSchedule[groupWorker.WorkerID][slotKey] = true;
            }
            
            // Create groupId for groups with 2+ cars, prioritizing the largest group
            let groupId = null;
            if (tasks.length > 1) {
                // Find the largest time group for this customer
                const allGroupSizes = Object.values(timeGroups).map(group => group.length);
                const maxGroupSize = Math.max(...allGroupSizes);
                
                // Only assign groupId to the largest group(s)
                if (tasks.length === maxGroupSize) {
                    groupId = `${customer.CustomerID}-${timeKey}`;
                }
            }
            
            tasks.forEach(wash => {
                schedule.push({
                    day: wash.washDay,
                    appointmentDate: getDateForDay(wash.washDay, weekOffset),
                    time: wash.washTime,
                    customerId: customer.CustomerID,
                    customerName: customer.CustomerName || customer.Name,
                    villa: customer.Villa,
                    carPlate: wash.carPlate,
                    washType: wash.washType,
                    workerName: groupWorker.Name,
                    workerId: groupWorker.WorkerID.replace('WORKER-', 'WORK-'),
                    packageType: customer.Washman_Package || '',
                    isLocked: 'FALSE',
                    scheduleDate: new Date().toISOString().split('T')[0],
                    groupId: groupId
                });
            });
        });

      } catch (customerError) {
        console.error(`[BUILD-SCHEDULE] Error processing customer ${customer.Name}:`, customerError);
        continue;
      }
    }
    
    console.log(`[BUILD-SCHEDULE] Generated ${schedule.length} schedule items`);
    return schedule;
    
  } catch (error) {
    console.error('[BUILD-SCHEDULE] Fatal error:', error);
    throw error;
  }
}

function calculateWashSchedule(customer, carPlate, allCarPlates, history, allHistory, weekOffset = 0) {
  const package = customer.Washman_Package;
  const washSchedule = [];
  
  // Parse package to get frequency and wash types
  const packageInfo = parsePackage(package);
  packageInfo.weekOffset = weekOffset; // Add weekOffset to packageInfo
  
  // Generate wash days for the week based on frequency
  const washDays = generateWashDays(packageInfo.frequency, customer.Days);
  
  // console.log(`[CALC-SCHEDULE] Customer: ${customer.Name}, Package: ${package}, Frequency: ${packageInfo.frequency}, WashDays: ${washDays}`);
  
  washDays.forEach((day, index) => {
    // For multi-car customers, determine which car gets INT for this visit
    let intCarForThisVisit = null;
    if (allCarPlates.length > 1) {
      intCarForThisVisit = determineIntCarForCustomer(allCarPlates, allHistory, index, weekOffset);
    }
    
    const washType = determineWashType(
      packageInfo, 
      index, 
      allCarPlates, 
      carPlate, 
      history, 
      day,
      allHistory,
      intCarForThisVisit
    );
    
    // Priority: 1. Specific Car Time -> 2. Notes Time -> 3. General Time
    let washTime = null;

    // 1. Check for specific car time in the 'Time' field (e.g., "9:00 AM Kia, 5:00 PM Jetour")
    if (customer.Time && allCarPlates.length > 1) {
        // Matches time followed immediately by car name, or car name followed by time
        // This regex is a bit simplified, might need adjustment based on exact data format
        const carTimePattern = new RegExp(`(\\d{1,2}:\\d{2}\\s*[AP]M)\\s*${escapeRegExp(carPlate)}|${escapeRegExp(carPlate)}\\s*(\\d{1,2}:\\d{2}\\s*[AP]M)`, 'i');
        const match = customer.Time.match(carTimePattern);
        if (match) {
             washTime = match[1] || match[2];
             // console.log(`[CAR-TIME] ${customer.Name} - ${carPlate}: Using specific car time ${washTime}`);
        }
    }

    // 2. If no specific car time, check Notes for day-specific time
    if (!washTime && customer.Notes) {
      const dayAbbrev = {
        'Monday': 'Mon', 'Tuesday': 'Tue', 'Wednesday': 'Wed', 
        'Thursday': 'Thu', 'Friday': 'Fri', 'Saturday': 'Sat', 'Sunday': 'Sun'
      };
      
      // Support formats: "Mon@7:00 AM", "Mon at 7:00 AM", "Mon 7:00 AM"
      // Using 'Thurs' for Thursday based on user preference, falling back to 'Thu' if standard.
      const dayShort = day === 'Thursday' ? 'Thurs' : dayAbbrev[day];
       // Also try standard 3-letter abbr if custom one fails
      const dayPatternStr = `(?:${dayShort}|${dayAbbrev[day]})\\s*[@:]?\\s*(?:at\\s*)?(\\d{1,2}:\\d{2}\\s*[AP]M)`;
      const dayPattern = new RegExp(dayPatternStr, 'i');

      const match = customer.Notes.match(dayPattern);
      if (match) {
        washTime = match[1];
        // console.log(`[NOTES-TIME] ${customer.Name} - ${day}: Using Notes time ${washTime} (priority over general Time field)`);
      }
    }

    // 3. Fallback to general Time field if it doesn't have car-specific info that we missed
    if (!washTime && customer.Time) {
         // If the time field DOES contain other car names, we might be incorrectly using it here.
         // But for simplicity, if we didn't match our car above, we take the whole string
         // or try to find a "generic" time in it.
         // For now, let's just use the whole field if it's simple, or try to extract first time if complex.
         washTime = customer.Time;
         // console.log(`[DEFAULT-TIME] ${customer.Name} - ${day}: Using default Time field ${washTime}`);
    }
    
    if (washTime) {
        washSchedule.push({
          carPlate,
          washDay: day,
          washTime: washTime,
          washType
        });
    } else {
        console.warn(`[NO-TIME] Could not determine wash time for customer ${customer.Name}, car ${carPlate} on ${day}`);
    }
  });
  
  return washSchedule;
}

// Helper to escape special regex characters in car plate
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function parsePackage(packageStr) {
  const parts = packageStr.split(' ');
  const frequency = parseInt(parts[0]);
  const hasInt = packageStr.includes('INT');
  const isBiWeek = packageStr.toLowerCase().includes('bi week') || packageStr.toLowerCase().includes('bi-week');
  
  return { frequency, hasInt, isBiWeek, packageStr };
}

function generateWashDays(frequency, daysString) {
  if (!daysString) {
    console.warn(`[WASH-DAYS] No days string provided, defaulting to Monday`);
    return ['Monday'];
  }
  
  // Parse days string. Handles separators: "-", ",", " and ", or just spaces.
  const dayParts = daysString.split(/[\s,\-]+| and /i).map(d => d.trim()).filter(d => d.length > 0);

  const dayMap = {
    'mon': 'Monday', 'tue': 'Tuesday', 'wed': 'Wednesday', 'thu': 'Thursday', 'thurs': 'Thursday',
    'fri': 'Friday', 'sat': 'Saturday', 'sun': 'Sunday',
    // Full names just in case
    'monday': 'Monday', 'tuesday': 'Tuesday', 'wednesday': 'Wednesday', 'thursday': 'Thursday',
    'friday': 'Friday', 'saturday': 'Saturday', 'sunday': 'Sunday'
  };
  
  const washDays = [];
  
  dayParts.forEach(dayPart => {
    const lowerDay = dayPart.toLowerCase();
    // Check for exact match first
    let fullDay = dayMap[lowerDay];
    
    // If no exact match, try partial match (e.g. 'wen' for Wednesday) - be careful not to overmatch
    if (!fullDay) {
        for (const key in dayMap) {
            if (lowerDay.startsWith(key) || key.startsWith(lowerDay)) {
                fullDay = dayMap[key];
                break;
            }
        }
    }

    if (fullDay && !washDays.includes(fullDay)) {
      washDays.push(fullDay);
    }
  });
  
  if (washDays.length === 0) {
    console.warn(`[WASH-DAYS] Could not parse days: "${daysString}", defaulting to Monday`);
    return ['Monday'];
  }
  
  // console.log(`[WASH-DAYS] Parsed "${daysString}" to: ${washDays}`);
  return washDays;
}

function determineWashType(packageInfo, visitIndex, allCarPlates, currentCarPlate, history, washDay, allHistory, intCarForThisCycle) {
  const packageName = packageInfo.packageStr || '';
  
  // console.log(`[WASH-TYPE] ${currentCarPlate} - Package: ${packageName} - Visit: ${visitIndex + 1}`);
  
  // Rule 1: 'Ext Only' packages are always EXT
  if (!packageInfo.hasInt) {
    // console.log(`[EXT-ONLY] ${currentCarPlate}: EXT (Ext Only package)`);
    return 'EXT';
  }
  
  let washType = 'EXT';
  
  // Rule 2: Single car customers - INT based on package type
  if (allCarPlates.length === 1) {
    if (packageName.toLowerCase().includes('2 ext 1 int')) {
      // 2 EXT 1 INT: EXT, INT, EXT (Frequency 3) OR just based on visit index if frequency is different
      // Assuming standard is: Visit 1=EXT, Visit 2=INT, Visit 3=EXT (if 3 visits)
      // If frequency is 2, it might be EXT, INT.
      washType = (visitIndex === 1) ? 'INT' : 'EXT';
      // console.log(`[2EXT1INT] ${currentCarPlate} - Visit ${visitIndex + 1}: ${washType}`);
    }
    else if (packageName.toLowerCase().includes('3 ext 1 int')) {
      // 3 EXT 1 INT: EXT, INT, EXT, EXT
      washType = (visitIndex === 1) ? 'INT' : 'EXT';
      // console.log(`[3EXT1INT] ${currentCarPlate} - Visit ${visitIndex + 1}: ${washType}`);
    }
    else {
       // Default fallback if package name doesn't match known patterns but has INT
       // Give INT on second visit as a safe default for "X EXT 1 INT"
       washType = (visitIndex === 1) ? 'INT' : 'EXT';
    //    console.log(`[DEFAULT] ${currentCarPlate} - Visit ${visitIndex + 1}: ${washType} (Generic INT package)`);
    }
  } else {
    // Rule 3: Multi-car customers - alternate INT between cars per visit
    // Using the pre-determined INT car for this cycle ensures consistency across all cars of the customer
    washType = (currentCarPlate === intCarForThisCycle) ? 'INT' : 'EXT';
    
    // Special case override for 3rd/4th visits in "2 EXT 1 INT" or "3 EXT 1 INT" packages if needed
    // The current logic might already handle this by how determineIntCarForCustomer rotates.
    // If you strictly only want ONE INT per week TOTAL across all cars for these packages:
    if (packageName.toLowerCase().includes('2 ext 1 int') && visitIndex > 1) {
         washType = 'EXT'; // Only first 2 visits get to have an INT (one for each car potentially, or rotated)
    }
    
    // console.log(`[MULTI-CAR] ${currentCarPlate} - Visit ${visitIndex + 1}: ${washType} (INT car: ${intCarForThisCycle})`);
  }
  
  // Rule 4: For bi-week packages, INT only applies on first week of cycle
  if (packageInfo.isBiWeek && washType === 'INT') {
    const isFirstWeekOfCycle = checkIfFirstWeekOfBiWeekCycle(allCarPlates, allHistory, packageInfo.weekOffset || 0);
    // console.log(`[BI-WEEK] ${currentCarPlate}: washType was ${washType}, isFirstWeek: ${isFirstWeekOfCycle}`);
    if (!isFirstWeekOfCycle) {
    //   console.log(`[BI-WEEK] ${currentCarPlate}: Converting INT to EXT (second week)`);
      return 'EXT';
    }
  }
  
  return washType;
}

function checkIfFirstWeekOfBiWeekCycle(allCarPlates, allHistory, weekOffset = 0) {
  // Helper to reliably parse dates, handling "DD-MMM-YYYY" and ISO formats
  const parseCustomDate = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const months = {'Jan':0, 'Feb':1, 'Mar':2, 'Apr':3, 'May':4, 'Jun':5, 'Jul':6, 'Aug':7, 'Sep':8, 'Oct':9, 'Nov':10, 'Dec':11};
    const parts = dateStr.split('-');
    if (parts.length === 3 && isNaN(parseInt(parts[1])) && months[parts[1]] !== undefined) {
      const day = parseInt(parts[0], 10);
      const month = months[parts[1]];
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(year)) return new Date(year, month, day);
    }
    const stdDate = new Date(dateStr);
    return isNaN(stdDate.getTime()) ? null : stdDate;
  };

  // Get relevant history, parse dates, filter invalid ones, sort descending
  const customerHistory = allHistory
    .filter(record => allCarPlates.includes(record.CarPlate))
    .map(record => ({ ...record, parsedDate: parseCustomDate(record.WashDate) }))
    .filter(record => record.parsedDate)
    .sort((a, b) => b.parsedDate - a.parsedDate);

  if (customerHistory.length === 0) {
    // No history: assume starting fresh, so even weeks (0, 2, 4...) are "First Week" (INT eligible)
    const isFirstWeek = (weekOffset % 2) === 0;
    // console.log(`[BI-WEEK] No history - Week ${weekOffset}: ${isFirstWeek ? 'First week (INT)' : 'Second week (EXT)'}`);
    return isFirstWeek;
  }

  const lastWashDate = customerHistory[0].parsedDate;
  const currentDate = new Date();
  // Target date for the schedule we are building
  const targetDate = new Date(currentDate.getTime() + (weekOffset * 7 * 24 * 60 * 60 * 1000));
  
  // Calculate difference in FULL WEEKS between last wash and target date.
  // We use Monday as start of week for consistency in calculation if needed, or just raw time diff.
  // Simple raw time diff in weeks:
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  // Use setHours(0,0,0,0) to normalize times for more accurate day/week diff
  const lastWashNormalized = new Date(lastWashDate); lastWashNormalized.setHours(0,0,0,0);
  const targetNormalized = new Date(targetDate); targetNormalized.setHours(0,0,0,0);
  
  const weeksDiff = Math.floor((targetNormalized - lastWashNormalized) / msPerWeek);

  // console.log(`[BI-WEEK] Last wash: ${lastWashDate.toDateString()}, Target: ${targetDate.toDateString()}, Weeks diff: ${weeksDiff}`);

  // If it's been an even number of weeks (0, 2, 4...), we are back to the "First Week" of the cycle.
  // If odd (1, 3, 5...), we are in the "Second Week" (EXT only).
  // Need to be careful: if weeksDiff is 0, it means we are IN the same week as last wash.
  // If we want bi-weekly from the LAST wash, then 0 means same week (don't repeat INT if already done?),
  // 1 means next week (skip INT), 2 means INT eligible again.
  // Assuming 'weeksDiff' accurately represents the cycle gap.
  const isFirstWeek = (weeksDiff % 2) === 0;
  
  return isFirstWeek;
}

function determineIntCarForCustomer(allCarPlates, allHistory, visitIndex = 0, weekOffset = 0) {
  // For multi-car customers: alternate INT between cars based on visit number
  const sortedPlates = [...allCarPlates].sort();
  
  // Simple rotation based on week number and visit index.
  // This ensures deterministic rotation without relying heavily on potentially messy history for JUST rotation base.
  // (history is still used for bi-week eligibility).
  // Base car changes every week to ensure fair rotation over time.
  const baseCarIndex = weekOffset % sortedPlates.length;
  const intCarIndex = (baseCarIndex + visitIndex) % sortedPlates.length;
  
  // console.log(`[MULTI-CAR] Week ${weekOffset}, Visit ${visitIndex + 1}: Base index ${baseCarIndex}, INT car: ${sortedPlates[intCarIndex]}`);
  
  return sortedPlates[intCarIndex];
}

// Simple function to find available worker for a specific time slot
function findAvailableWorker(workers, workerSchedule, day, time, shouldReserve = true) {
  const timeSlots = parseTimeSlots(time);
  
  // Try to find a worker who is not busy at ANY of these exact time slots
  for (const worker of workers) {
    let isAvailable = true;
    
    for (const timeSlot of timeSlots) {
      const slotKey = `${day}-${timeSlot}`;
      if (workerSchedule[worker.WorkerID] && workerSchedule[worker.WorkerID][slotKey]) {
        isAvailable = false;
        break;
      }
    }
    
    if (isAvailable) {
      // Mark this worker as busy for these time slots only if shouldReserve is true
      if (shouldReserve) {
        if (!workerSchedule[worker.WorkerID]) {
          workerSchedule[worker.WorkerID] = {};
        }
        
        for (const timeSlot of timeSlots) {
          const slotKey = `${day}-${timeSlot}`;
          workerSchedule[worker.WorkerID][slotKey] = true;
        }
      }
      
      return worker;
    }
  }
  
  // If all workers are busy, return null to indicate no availability
  return null;
}

// Helper function to parse complex time strings into individual time slots
function parseTimeSlots(timeString) {
  if (!timeString) return [];
  
  // Handle formats like "1:00 PM & 1:00 PM", "6:00 AM Lincoln, 6:00 AM Cadillac"
  // Extracts just the time part "HH:MM AM/PM"
  const timePattern = /\d{1,2}:\d{2}\s*[AP]M/gi;
  const matches = timeString.match(timePattern);
  
  if (matches && matches.length > 0) {
    // Return unique time slots to avoid duplicate checking for same time
    return [...new Set(matches.map(time => time.trim()))];
  }
  
  return [timeString.trim()];
}

// Helper function to get date for a specific day
function getDateForDay(dayName, weekOffset = 0) {
  const today = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const targetDayIndex = dayNames.indexOf(dayName);
  
  if (targetDayIndex === -1) return today.toLocaleDateString();
  
  const currentDayIndex = today.getDay();
  // Calculate date of the target day in the CURRENT week (starting Sunday)
  let daysToAdd = targetDayIndex - currentDayIndex;
  
  // Adjust to ensure we are looking at the current week or next week appropriately if needed.
  // For standard "upcoming week" view, if today is Friday and we want Monday, it might mean NEXT Monday.
  // But standard simple logic often just takes the day within the same calendar week.
  // Let's stick to a simple "this week" logic + offset.
  
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + daysToAdd + (weekOffset * 7));
  
  return targetDate.toLocaleDateString();
}

// Clear all schedule data
async function clearSchedule() {
  try {
    console.log('[CLEAR-SCHEDULE] Clearing all schedule data...');
    const db = require('./databaseService');
    
    const result = await db.clearAndWriteSchedule([]);
    console.log('[CLEAR-SCHEDULE] Schedule cleared successfully');
    return result;
    
  } catch (error) {
    console.error('[CLEAR-SCHEDULE] Error:', error);
    throw error;
  }
}

// Function to calculate available times for a specific day
async function getAvailableTimesForDay(day, weekOffset = 0) {
  try {
    const db = require('./databaseService');
    const [currentSchedule, allWorkers] = await Promise.all([
      db.getScheduledTasks(),
      db.getWorkers()
    ]);
    
    const activeWorkers = allWorkers.filter(worker => worker.Status === 'Active');
    
    console.log(`[AVAILABLE-TIMES] Day: ${day}, Total workers: ${allWorkers.length}, Active workers: ${activeWorkers.length}`);
    
    if (activeWorkers.length === 0) {
      return [];
    }
    
    // All possible time slots
    const allTimes = [
      '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
      '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'
    ];
    
    // Count busy workers for each time slot from current schedule
    const busyCount = {};
    allTimes.forEach(time => {
      busyCount[time] = 0;
    });
    
    // Count assignments for the specific day from current schedule
    currentSchedule.forEach(task => {
      if (task.Day === day || task.day === day) {
        const timeSlots = parseTimeSlots(task.Time || task.time);
        timeSlots.forEach(timeSlot => {
          if (busyCount[timeSlot] !== undefined) {
            busyCount[timeSlot]++;
          }
        });
      }
    });
    
    // Return times where at least one worker is free
    const availableTimes = allTimes.filter(time => busyCount[time] < activeWorkers.length);
    console.log(`[AVAILABLE-TIMES] Day: ${day}, Busy count:`, busyCount);
    console.log(`[AVAILABLE-TIMES] Available times:`, availableTimes);
    return availableTimes;
    
  } catch (error) {
    console.error('[GET-AVAILABLE-TIMES] Error:', error);
    return [];
  }
}

module.exports = {
  buildWeeklySchedule,
  determineIntCarForCustomer,
  checkIfFirstWeekOfBiWeekCycle,
  clearSchedule,
  getAvailableTimesForDay
};