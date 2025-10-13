const { getCustomers, getAllHistory } = require('./googleSheetsService');

// Cache for frequently used data
let dataCache = {
  customers: null,
  history: null,
  lastUpdate: 0,
  packageCache: new Map(),
  dateCache: new Map()
};

const CACHE_DURATION = 30000; // 30 seconds

async function buildWeeklySchedule(weekOffset = 0) {
  // Use cached data if available and fresh
  const now = Date.now();
  let allCustomers, allHistory;
  
  if (dataCache.customers && dataCache.history && (now - dataCache.lastUpdate) < CACHE_DURATION) {
    allCustomers = dataCache.customers;
    allHistory = dataCache.history;
  } else {
    // Fetch fresh data
    allCustomers = await getCustomers();
    allHistory = await getAllHistory();
    
    // Update cache
    dataCache.customers = allCustomers;
    dataCache.history = allHistory;
    dataCache.lastUpdate = now;
  }
  
  // Include both Active and Booked customers
  const activeCustomers = allCustomers.filter(customer => 
    customer.Status === 'Active' || customer.Status === 'Booked'
  );
  const schedule = [];
  
  // Process customers in batches for better performance
  const BATCH_SIZE = 20;
  const batches = [];
  
  for (let i = 0; i < activeCustomers.length; i += BATCH_SIZE) {
    batches.push(activeCustomers.slice(i, i + BATCH_SIZE));
  }
  
  for (const batch of batches) {
    const batchPromises = batch.map(customer => processCustomer(customer, allHistory, weekOffset));
    const batchResults = await Promise.all(batchPromises);
    
    batchResults.forEach(customerSchedule => {
      if (customerSchedule) {
        schedule.push(...customerSchedule);
      }
    });
  }
  
  return schedule;
}

function processCustomer(customer, allHistory, weekOffset) {
  // Safety check for invalid package name
  if (!customer.Washman_Package || customer.Washman_Package.trim() === '') {
    return null;
  }
  
  // Parse car plates into array
  const carPlates = customer.CarPlates.split(',').map(plate => plate.trim());
  const customerSchedule = [];
  
  for (const carPlate of carPlates) {
    // Filter history locally instead of API call
    const history = allHistory
      .filter(record => record.CarPlate === carPlate)
      .sort((a, b) => new Date(b.WashDate) - new Date(a.WashDate));
    
    // Determine wash schedule based on package
    const washSchedule = calculateWashSchedule(customer, carPlate, carPlates, history, allHistory, weekOffset);
    
    // Add to schedule array
    washSchedule.forEach(wash => {
      customerSchedule.push({
        customerName: customer.CustomerName,
        villa: customer.Villa,
        carPlate: wash.carPlate,
        washDay: wash.washDay,
        washTime: wash.washTime,
        washType: wash.washType,
        customerStatus: customer.Status,
        scheduleDate: new Date().toISOString().split('T')[0]
      });
    });
  }
  
  return customerSchedule;
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
  // Use cache for package parsing
  if (dataCache.packageCache.has(packageStr)) {
    return dataCache.packageCache.get(packageStr);
  }
  
  const parts = packageStr.split(' ');
  const frequency = parseInt(parts[0]);
  const hasInt = packageStr.includes('INT');
  const isBiWeek = packageStr.includes('bi week');
  
  const result = { frequency, hasInt, isBiWeek, packageStr };
  dataCache.packageCache.set(packageStr, result);
  
  return result;
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
  const customerHistory = allHistory.filter(record => 
    allCarPlates.includes(record.CarPlate)
  ).sort((a, b) => {
    const parseCustomDate = (dateStr) => {
      if (!dateStr) return new Date(0);
      
      if (dataCache.dateCache.has(dateStr)) {
        return dataCache.dateCache.get(dateStr);
      }
      
      const months = {'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
                     'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11};
      const parts = dateStr.split('-');
      let result;
      
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = months[parts[1]];
        const year = parseInt(parts[2]);
        result = new Date(year, month, day);
      } else {
        result = new Date(dateStr);
      }
      
      dataCache.dateCache.set(dateStr, result);
      return result;
    };
    
    return parseCustomDate(b.WashDate) - parseCustomDate(a.WashDate);
  });
  
  if (customerHistory.length === 0) {
    const isFirstWeek = (weekOffset % 2) === 0;
    return isFirstWeek;
  }
  
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
    return new Date(dateStr);
  };
  
  const lastWashDate = parseCustomDate(customerHistory[0].WashDate);
  const currentDate = new Date();
  const targetDate = new Date(currentDate.getTime() + (weekOffset * 7 * 24 * 60 * 60 * 1000));
  const daysDiff = Math.floor((targetDate - lastWashDate) / (1000 * 60 * 60 * 1000));
  
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

// Function to clear cache when needed
function clearCache() {
  dataCache.customers = null;
  dataCache.history = null;
  dataCache.lastUpdate = 0;
  dataCache.packageCache.clear();
  dataCache.dateCache.clear();
}

module.exports = {
  buildWeeklySchedule,
  determineIntCarForCustomer,
  checkIfFirstWeekOfBiWeekCycle,
  clearCache
};

