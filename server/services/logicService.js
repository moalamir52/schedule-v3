const { getCustomers, getAllHistory } = require('./googleSheetsService');

async function buildWeeklySchedule(weekOffset = 0) {
  // Get all data in just two API calls
  const allCustomers = await getCustomers();
  const allHistory = await getAllHistory();
  
  // Include both Active and Booked customers
  const activeCustomers = allCustomers.filter(customer => 
    customer.Status === 'Active' || customer.Status === 'Booked'
  );
  const schedule = [];
  
  for (const customer of activeCustomers) {
    // Safety check for invalid package name
    if (!customer.Washman_Package || customer.Washman_Package.trim() === '') {
      console.warn(`Skipping customer '${customer.Name}' due to invalid package name.`);
      continue;
    }
    
    // Parse car plates into array
    const carPlates = customer.CarPlates.split(',').map(plate => plate.trim());
    

    
    for (const carPlate of carPlates) {
      // Filter history locally instead of API call
      const history = allHistory
        .filter(record => record.CarPlate === carPlate)
        .sort((a, b) => new Date(b.WashDate) - new Date(a.WashDate));
      
      // Determine wash schedule based on package
      const washSchedule = calculateWashSchedule(customer, carPlate, carPlates, history, allHistory, weekOffset);
      
      // Add to schedule array
      washSchedule.forEach(wash => {
        schedule.push({
          customerName: customer.CustomerName,
          villa: customer.Villa,
          carPlate: wash.carPlate,
          washDay: wash.washDay,
          washTime: wash.washTime,
          washType: wash.washType,
          customerStatus: customer.Status, // Add customer status
          scheduleDate: new Date().toISOString().split('T')[0]
        });
      });
    }
  }
  
  return schedule;
}

function calculateWashSchedule(customer, carPlate, allCarPlates, history, allHistory, weekOffset = 0) {
  const package = customer.Washman_Package;
  const washSchedule = [];
  
  // Parse package to get frequency and wash types
  const packageInfo = parsePackage(package);
  packageInfo.weekOffset = weekOffset; // Add weekOffset to packageInfo
  
  // Generate wash days for the week based on frequency
  const washDays = generateWashDays(packageInfo.frequency, customer.WashDay);
  
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
    
    washSchedule.push({
      carPlate,
      washDay: day,
      washTime: customer.WashTime,
      washType
    });
  });
  
  return washSchedule;
}

function parsePackage(packageStr) {
  const parts = packageStr.split(' ');
  const frequency = parseInt(parts[0]);
  const hasInt = packageStr.includes('INT');
  const isBiWeek = packageStr.includes('bi week');
  
  return { frequency, hasInt, isBiWeek, packageStr };
}

function generateWashDays(frequency, startDay) {
  // Simple implementation - distribute washes evenly through week
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const startIndex = days.indexOf(startDay);
  const washDays = [];
  
  for (let i = 0; i < frequency; i++) {
    const dayIndex = (startIndex + i * Math.floor(7 / frequency)) % 7;
    washDays.push(days[dayIndex]);
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
      // 2 EXT 1 INT: EXT, INT, EXT
      washType = (visitIndex === 1) ? 'INT' : 'EXT';
    }
    else if (packageName.toLowerCase().includes('3 ext 1 int')) {
      // 3 EXT 1 INT: EXT, INT, EXT, EXT
      washType = (visitIndex === 1) ? 'INT' : 'EXT';
    }
  } else {
    // Rule 3: Multi-car customers - alternate INT between cars per visit
    if (packageName.toLowerCase().includes('2 ext 1 int')) {
      // For 2 EXT 1 INT: Visit 1 & 2 have INT rotation, Visit 3 is all EXT
      if (visitIndex === 0 || visitIndex === 1) {
        washType = (currentCarPlate === intCarForThisCycle) ? 'INT' : 'EXT';
      } else {
        washType = 'EXT'; // Visit 3 is all EXT
      }
    }
    else if (packageName.toLowerCase().includes('3 ext 1 int')) {
      // For 3 EXT 1 INT: Visit 1 & 2 have INT rotation, Visit 3 & 4 are all EXT
      if (visitIndex === 0 || visitIndex === 1) {
        washType = (currentCarPlate === intCarForThisCycle) ? 'INT' : 'EXT';
      } else {
        washType = 'EXT'; // Visit 3 & 4 are all EXT
      }
    }
    else {
      // Default multi-car logic
      washType = (currentCarPlate === intCarForThisCycle) ? 'INT' : 'EXT';
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
  // Get all wash history for this customer's cars
  const customerHistory = allHistory.filter(record => 
    allCarPlates.includes(record.CarPlate)
  ).sort((a, b) => {
    // Parse dates in DD-MMM-YYYY format (e.g., 8-Oct-2025)
    const parseCustomDate = (dateStr) => {
      if (!dateStr) return new Date(0);
      const months = {'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
                     'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11};
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = months[parts[1]];
        const year = parseInt(parts[2]);
        return new Date(year, month, day);
      }
      return new Date(dateStr); // Fallback to default parsing
    };
    
    return parseCustomDate(b.WashDate) - parseCustomDate(a.WashDate);
  });
  
  if (customerHistory.length === 0) {
    // No history: week 0 = first week, week 1 = second week, week 2 = first week again
    const isFirstWeek = (weekOffset % 2) === 0;
    return isFirstWeek;
  }
  
  // Parse the custom date format
  const parseCustomDate = (dateStr) => {
    if (!dateStr) return new Date(0);
    const months = {'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
                   'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11};
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = months[parts[1]];
      const year = parseInt(parts[2]);
      return new Date(year, month, day);
    }
    return new Date(dateStr); // Fallback to default parsing
  };
  
  const lastWashDate = parseCustomDate(customerHistory[0].WashDate);
  const currentDate = new Date();
  // Add weekOffset to current date for future/past weeks
  const targetDate = new Date(currentDate.getTime() + (weekOffset * 7 * 24 * 60 * 60 * 1000));
  const daysDiff = Math.floor((targetDate - lastWashDate) / (1000 * 60 * 60 * 1000));
  
  // Bi-weekly cycle: 14 days = 2 weeks
  // Calculate which week of the bi-weekly cycle we're in
  const weeksSinceLastWash = Math.floor(daysDiff / 7);
  const isFirstWeek = (weeksSinceLastWash % 2) === 0;
  
  return isFirstWeek;
}

function getSingleCarWashType(frequency, visitIndex) {
  // For '2 Ext 1 INT week' - second visit is INT
  if (frequency === 2) {
    return visitIndex === 1 ? 'INT' : 'EXT';
  }
  
  // For '3 Ext 1 INT week' - middle visit (index 1) is INT
  if (frequency === 3) {
    return visitIndex === 1 ? 'INT' : 'EXT';
  }
  
  return 'EXT';
}

function getMultiCarWashType(allCarPlates, currentCarPlate, allHistory) {
  // Find last INT wash across ALL customer's cars
  const customerHistory = allHistory.filter(record => 
    allCarPlates.includes(record.CarPlate) && record.WashType === 'INT'
  ).sort((a, b) => new Date(b.WashDate) - new Date(a.WashDate));
  
  if (customerHistory.length === 0) {
    // No previous INT wash, give INT to first car alphabetically
    const sortedPlates = [...allCarPlates].sort();
    return currentCarPlate === sortedPlates[0] ? 'INT' : 'EXT';
  }
  
  // Get the last INT wash across all cars
  const lastIntWash = customerHistory[0];
  
  // Alternate INT to different car than last time
  const currentCarIndex = allCarPlates.indexOf(currentCarPlate);
  const lastIntCarIndex = allCarPlates.indexOf(lastIntWash.CarPlate);
  const nextIntCarIndex = (lastIntCarIndex + 1) % allCarPlates.length;
  
  return currentCarIndex === nextIntCarIndex ? 'INT' : 'EXT';
}

function determineIntCarForCustomer(allCarPlates, allHistory, visitIndex = 0, weekOffset = 0) {
  // For multi-car customers: alternate INT between cars based on visit number
  const sortedPlates = [...allCarPlates].sort();
  
  // Check if there's any previous INT wash history
  const customerHistory = allHistory.filter(record => 
    allCarPlates.includes(record.CarPlate) && record.WashType === 'INT'
  ).sort((a, b) => new Date(b.WashDate) - new Date(a.WashDate));
  
  let baseCarIndex = 0; // Default to first car
  
  if (customerHistory.length > 0) {
    // Find which car got INT last time and continue rotation from there
    const lastIntCar = customerHistory[0].CarPlate;
    const lastIntCarIndex = sortedPlates.indexOf(lastIntCar);
    baseCarIndex = (lastIntCarIndex + 1) % sortedPlates.length;
  } else {
    // No history: use weekOffset to determine starting car rotation
    baseCarIndex = weekOffset % sortedPlates.length;
  }
  
  // Alternate based on visit number
  const intCarIndex = (baseCarIndex + visitIndex) % sortedPlates.length;
  
  return sortedPlates[intCarIndex];
}

module.exports = {
  buildWeeklySchedule,
  determineIntCarForCustomer,
  checkIfFirstWeekOfBiWeekCycle
};

