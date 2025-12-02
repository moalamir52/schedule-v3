// logicService.js
// Use database service instead of Google Sheets

// Global variable to store skipped customers
let skippedCustomers = [];

async function buildWeeklySchedule(weekOffset = 0) {
  try {
    // Reset skipped customers for new schedule generation
    skippedCustomers = [];
    
    // Get all data from database
    const db = require('./databaseService');
    
    // Clear old skipped customers from database to avoid duplicates
    try {
      // Get existing skipped customers and delete them one by one
      const existingSkipped = await db.getSkippedCustomers();
      const today = new Date().toISOString().split('T')[0];
      
      for (const skipped of existingSkipped) {
        if (skipped.SkippedDate === today) {
          try {
            await db.deleteSkippedCustomer(skipped.SkippedID);
          } catch (e) {
            // Continue if delete fails
          }
        }
      }

    } catch (clearError) {

    }
    const [allCustomers, allHistory, allWorkers] = await Promise.all([
      db.getCustomers(),
      db.getAllHistory(),
      db.getWorkers()
    ]);
    
    const activeCustomers = allCustomers.filter(customer => customer.Status === 'Active');
    const activeWorkers = allWorkers.filter(worker => worker.Status === 'Active');
    const schedule = [];
    
    if (activeCustomers.length === 0) {
      return [];
    }
    
    if (activeWorkers.length === 0) {
      return [];
    }
    
    // Track worker assignments to avoid conflicts
    const workerSchedule = {}; // {workerId: {day-time: {CustomerID, CustomerName}}}
    const workerStats = {}; // Track how many tasks each worker gets
    let customerIndex = 0; // Track customer processing order
    
    // Initialize worker stats and reset rotation
    workerRotationIndex = 0; // Reset for fair distribution
    activeWorkers.forEach(worker => {
      workerStats[worker.WorkerID] = {
        name: worker.Name,
        totalTasks: 0,
        tasksByDay: {}
      };
    });
    
    for (const customer of activeCustomers) {
      customerIndex++;
      try {
        // Safety checks for required fields
        if (!customer.Washman_Package || customer.Washman_Package.trim() === '') {

          const skippedData = {
            customerName: customer.CustomerName || customer.Name,
            customerId: customer.CustomerID,
            villa: customer.Villa,
            reason: 'No package specified'
          };
          skippedCustomers.push(skippedData);
          try {
            await addSkippedCustomer(customer, 'No package specified');
          } catch (e) {
            console.log('Failed to save skipped customer to DB:', e.message);
          }
          continue;
        }
        
        if (!customer.Days || (!customer.Time && !customer.Notes)) {

          const skippedData = {
            customerName: customer.CustomerName || customer.Name,
            customerId: customer.CustomerID,
            villa: customer.Villa,
            reason: 'No days or time specified'
          };
          skippedCustomers.push(skippedData);
          try {
            await addSkippedCustomer(customer, 'No days or time specified');
          } catch (e) {
            console.log('Failed to save skipped customer to DB:', e.message);
          }
          continue;
        }
        
        if (!customer.CarPlates) {

          const skippedData = {
            customerName: customer.CustomerName || customer.Name,
            customerId: customer.CustomerID,
            villa: customer.Villa,
            reason: 'No car plates specified'
          };
          skippedCustomers.push(skippedData);
          await addSkippedCustomer(customer, 'No car plates specified');
          continue;
        }
        
        // Parse car plates into array
        const carPlates = customer.CarPlates.split(',').map(plate => plate.trim()).filter(plate => plate);
        
        if (carPlates.length === 0) {

          const skippedData = {
            customerName: customer.CustomerName || customer.Name,
            customerId: customer.CustomerID,
            villa: customer.Villa,
            reason: 'No valid car plates'
          };
          skippedCustomers.push(skippedData);
          try {
            await addSkippedCustomer(customer, 'No valid car plates');
          } catch (e) {
            console.log('Failed to save skipped customer to DB:', e.message);
          }
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

                // Track and save skipped customer
                tasks.forEach(async (task) => {
                    const skippedCustomer = {
                        customerName: customer.CustomerName || customer.Name,
                        customerId: customer.CustomerID,
                        villa: customer.Villa,
                        day: day,
                        time: time,
                        carPlate: task.carPlate,
                        reason: 'No available workers'
                    };
                    skippedCustomers.push(skippedCustomer);
                    
                    // Save to database
                    try {
                        await addSkippedCustomer({
                            CustomerID: customer.CustomerID,
                            CustomerName: customer.CustomerName || customer.Name,
                            Villa: customer.Villa,
                            CarPlates: task.carPlate,
                            Days: day,
                            Time: time
                        }, 'No available workers');
                    } catch (e) {

                    }
                    

                });
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
                // Update worker stats
                workerStats[groupWorker.WorkerID].totalTasks++;
                if (!workerStats[groupWorker.WorkerID].tasksByDay[wash.washDay]) {
                  workerStats[groupWorker.WorkerID].tasksByDay[wash.washDay] = 0;
                }
                workerStats[groupWorker.WorkerID].tasksByDay[wash.washDay]++;
                
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
        continue;
      }
    }
    
    // Add skipped customers as a property to the schedule array

    if (skippedCustomers.length > 0) {

    }
    
    // Create skipped customers message
    let skippedMessage = '';
    if (skippedCustomers.length > 0) {
      skippedMessage = `⚠️ تم تخطي ${skippedCustomers.length} عملاء:\n\n`;
      skippedCustomers.forEach((customer, index) => {
        skippedMessage += `${index + 1}. ${customer.customerName} - ${customer.villa} - ${customer.carPlate}\n   اليوم: ${customer.day} - الوقت: ${customer.time}\n   السبب: ${customer.reason}\n\n`;
      });
      skippedMessage += 'برجاء مراجعة جدولة العمال أو إضافة عمال جدد.';
    }
    
    // Log worker distribution
    console.log('\n📊 توزيع المهام على العمال:');
    console.log('=' .repeat(50));
    
    let totalAssignedTasks = 0;
    Object.values(workerStats).forEach(worker => {
      totalAssignedTasks += worker.totalTasks;
      console.log(`👷 ${worker.name}: ${worker.totalTasks} مهمة`);
      
      if (worker.totalTasks > 0) {
        Object.entries(worker.tasksByDay).forEach(([day, count]) => {
          console.log(`   - ${day}: ${count} مهمة`);
        });
      } else {
        console.log('   ❌ لم يتم تعيين أي مهام');
      }
      console.log('');
    });
    
    console.log(`📈 إجمالي المهام المعينة: ${totalAssignedTasks}`);
    console.log(`📋 إجمالي المهام المجدولة: ${schedule.length}`);
    console.log('=' .repeat(50));
    
    schedule.skippedCustomers = skippedCustomers;
    schedule.skippedMessage = skippedMessage;
    schedule.workerStats = workerStats;
    return schedule;
    
  } catch (error) {
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
    
    // Priority: 1. Notes Time -> 2. Day-specific Time -> 3. Specific Car Time -> 4. General Time
    let washTime = null;

    // 1. Check Notes for day-specific time FIRST (highest priority)
    if (customer.Notes) {
      const dayAbbrev = {
        'Monday': 'Mon', 'Tuesday': 'Tue', 'Wednesday': 'Wed', 
        'Thursday': 'Thu', 'Friday': 'Fri', 'Saturday': 'Sat', 'Sunday': 'Sun'
      };
      
      const dayShort = day === 'Thursday' ? 'Thurs' : dayAbbrev[day];
      const dayPatternStr = `(?:${dayShort}|${dayAbbrev[day]})\\s*[@:]?\\s*(?:at\\s*)?(\\d{1,2}:\\d{2}\\s*[AP]M)`;
      const dayPattern = new RegExp(dayPatternStr, 'i');

      const match = customer.Notes.match(dayPattern);
      if (match) {
        washTime = match[1];
      }
    }

    // 2. Check for day-specific time in Time field (e.g., "Mon@1:00 PM test, Sat@2:00 PM car")
    if (!washTime && customer.Time) {
      const dayAbbrev = {
        'Monday': 'Mon', 'Tuesday': 'Tue', 'Wednesday': 'Wed', 
        'Thursday': 'Thu', 'Friday': 'Fri', 'Saturday': 'Sat', 'Sunday': 'Sun'
      };
      
      const dayShort = day === 'Thursday' ? 'Thurs' : dayAbbrev[day];
      // Updated pattern to handle "Mon@1:00 PM CarName" format
      const dayPatternStr = `(?:${dayShort}|${dayAbbrev[day]})\\s*[@:]?\\s*(\\d{1,2}:\\d{2}\\s*[AP]M)`;
      const dayPattern = new RegExp(dayPatternStr, 'gi'); // Added 'g' flag for global search

      // Find ALL matches for this day
      const matches = [...customer.Time.matchAll(dayPattern)];
      if (matches.length > 0) {
        // For each car, find its specific time or use the first available time for this day
        const dayTimes = matches.map(match => match[1]);
        
        // Try to find car-specific time first
        let carSpecificTime = null;
        matches.forEach(match => {
          const fullMatch = match[0];
          const time = match[1];
          // Check if this match contains the current car plate
          const afterTime = customer.Time.substring(customer.Time.indexOf(fullMatch) + fullMatch.length);
          const nextComma = afterTime.indexOf(',');
          const carPart = nextComma > -1 ? afterTime.substring(0, nextComma) : afterTime;
          
          if (carPart.toLowerCase().includes(carPlate.toLowerCase()) || 
              carPlate.toLowerCase().includes(carPart.trim().toLowerCase())) {
            carSpecificTime = time;
          }
        });
        
        washTime = carSpecificTime || dayTimes[0]; // Use car-specific time or first time for this day
      }
    }

    // 3. Check for specific car time in the 'Time' field (e.g., "6:00 AM Lincoln, 6:00 AM Cadillac, 11:00 AM Nissan")
    if (!washTime && customer.Time && allCarPlates.length > 1) {
        
        // Split by comma and check each part for this car
        const timeParts = customer.Time.split(',').map(part => part.trim());
        
        for (const part of timeParts) {

            // Check if this part contains the current car plate (with fuzzy matching)
            const carFound = part.toLowerCase().includes(carPlate.toLowerCase()) || 
                           carPlate.toLowerCase().includes(part.toLowerCase().replace(/(\d{1,2}:\d{2}\s*[ap]m)/i, '').trim()) ||
                           isCarNameMatch(carPlate, part);
            
            if (carFound) {

                // Extract time from this part
                const timeMatch = part.match(/(\d{1,2}:\d{2}\s*[AP]M)/i);

                if (timeMatch) {
                    washTime = timeMatch[1];

                    break;
                }
            } else {

            }
        }
        
        // If no specific time found for this car, try to find any time that matches the car name pattern
        if (!washTime) {
            const carTimePattern = new RegExp(`(\\d{1,2}:\\d{2}\\s*[AP]M)\\s+[^,]*${escapeRegExp(carPlate)}|${escapeRegExp(carPlate)}\\s+(\\d{1,2}:\\d{2}\\s*[AP]M)`, 'i');
            const match = customer.Time.match(carTimePattern);
            if (match) {
                washTime = match[1] || match[2];

            }
        }
        

    }

    // 4. Fallback to general Time field if no specific patterns matched
    if (!washTime && customer.Time) {
         // Only use as fallback if it's a simple time format
         const simpleTimePattern = /^\d{1,2}:\d{2}\s*[AP]M$/i;
         if (simpleTimePattern.test(customer.Time.trim())) {
           washTime = customer.Time.trim();
         }
    }
    
    if (washTime) {
        washSchedule.push({
          carPlate,
          washDay: day,
          washTime: washTime,
          washType
        });
    }
  });
  
  return washSchedule;
}

// Helper to check if car names match (handles spelling variations)
function isCarNameMatch(carPlate, timePart) {
  const carLower = carPlate.toLowerCase();
  const partLower = timePart.toLowerCase();
  
  // Common spelling variations
  const variations = {
    'caddilac': ['cadillac', 'caddilac'],
    'cadillac': ['caddilac', 'cadillac'],
    'lincoln': ['lincon', 'lincoln'],
    'nissan': ['nisan', 'nissan']
  };
  
  // Check if any variation matches
  for (const [key, variants] of Object.entries(variations)) {
    if (variants.includes(carLower)) {
      for (const variant of variants) {
        if (partLower.includes(variant)) {
          return true;
        }
      }
    }
  }
  
  return false;
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
    return ['Monday'];
  }
  
  return washDays;
}

function determineWashType(packageInfo, visitIndex, allCarPlates, currentCarPlate, history, washDay, allHistory, intCarForThisCycle) {
  const packageName = packageInfo.packageStr || '';
  
  // Rule 1: 'Ext Only' packages are always EXT
  if (!packageInfo.hasInt) {
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
    } else if (packageName.toLowerCase().includes('3 ext 1 int')) {
      // 3 EXT 1 INT: EXT, INT, EXT, EXT
      washType = (visitIndex === 1) ? 'INT' : 'EXT';
    } else {
       // Default fallback if package name doesn't match known patterns but has INT
       // Give INT on second visit as a safe default for "X EXT 1 INT"
       washType = (visitIndex === 1) ? 'INT' : 'EXT';
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
  }
  
  // Rule 4: For bi-week packages, INT only applies on first week of cycle
  if (packageInfo.isBiWeek && washType === 'INT') {
    const isFirstWeekOfCycle = checkIfFirstWeekOfBiWeekCycle(allCarPlates, allHistory, packageInfo.weekOffset || 0);
    if (!isFirstWeekOfCycle) {
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
  
  return sortedPlates[intCarIndex];
}

// Global counter for round-robin worker assignment
let workerRotationIndex = 0;

// Fair distribution function to find available worker using round-robin
function findAvailableWorker(workers, workerSchedule, day, time, shouldReserve = true) {
  const timeSlots = parseTimeSlots(time);
  
  // Try round-robin starting from current rotation index
  for (let i = 0; i < workers.length; i++) {
    const workerIndex = (workerRotationIndex + i) % workers.length;
    const worker = workers[workerIndex];
    
    let isAvailable = true;
    
    for (const timeSlot of timeSlots) {
      const slotKey = `${day}-${timeSlot}`;
      if (workerSchedule[worker.WorkerID] && workerSchedule[worker.WorkerID][slotKey]) {
        isAvailable = false;
        break;
      }
    }
    
    if (isAvailable) {
      // Update rotation index for next assignment
      workerRotationIndex = (workerIndex + 1) % workers.length;
      
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
    const db = require('./databaseService');
    
    const result = await db.clearAndWriteSchedule([]);
    return result;
    
  } catch (error) {
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
    return availableTimes;
    
  } catch (error) {
    return [];
  }
}

// Function to get skipped customers - fallback to memory if DB fails
async function getSkippedCustomers() {
  try {
    const db = require('./databaseService');
    const dbResults = await db.getSkippedCustomers();
    
    // If database is empty but we have memory data, return memory data
    if (dbResults.length === 0 && skippedCustomers && skippedCustomers.length > 0) {
      return skippedCustomers;
    }
    return dbResults;
  } catch (error) {

    // Fallback to memory if database fails
    return skippedCustomers || [];
  }
}

// Function to get current skipped customers from memory (during schedule building)
function getCurrentSkippedCustomers() {
  return skippedCustomers || [];
}

// Function to add skipped customer to database
async function addSkippedCustomer(customerData, reason = 'No available time slots') {
  try {
    const db = require('./databaseService');
    const skippedRecord = {
      SkippedID: `SKIP-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      CustomerID: customerData.CustomerID || '',
      CustomerName: customerData.CustomerName || customerData.Name || 'Unknown',
      Villa: customerData.Villa || '',
      CarPlate: customerData.CarPlates || customerData.CarPlate || '',
      ScheduledDay: customerData.Days || customerData.ScheduledDay || '',
      ScheduledTime: customerData.Time || customerData.ScheduledTime || '',
      SkipReason: reason || 'Unknown reason',
      WeekOffset: 0,
      SkippedDate: new Date().toISOString().split('T')[0],
      Status: 'Skipped'
    };
    

    await db.addSkippedCustomer(skippedRecord);
    return skippedRecord;
  } catch (error) {

    return null;
  }
}

module.exports = {
  buildWeeklySchedule,
  calculateWashSchedule,
  determineIntCarForCustomer,
  checkIfFirstWeekOfBiWeekCycle,
  clearSchedule,
  getAvailableTimesForDay,
  getSkippedCustomers,
  addSkippedCustomer,
  getCurrentSkippedCustomers
};