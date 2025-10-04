const { getCustomers, getAllHistory } = require('./googleSheetsService');

async function buildWeeklySchedule() {
  // Get all data in just two API calls
  const allCustomers = await getCustomers();
  const allHistory = await getAllHistory();
  
  const activeCustomers = allCustomers.filter(customer => customer.Status === 'Active');
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
      const washSchedule = calculateWashSchedule(customer, carPlate, carPlates, history);
      
      // Add to schedule array
      washSchedule.forEach(wash => {
        schedule.push({
          customerName: customer.CustomerName,
          villa: customer.Villa,
          carPlate: wash.carPlate,
          washDay: wash.washDay,
          washTime: wash.washTime,
          washType: wash.washType
        });
      });
    }
  }
  
  return schedule;
}

function calculateWashSchedule(customer, carPlate, allCarPlates, history) {
  const package = customer.Washman_Package;
  const washSchedule = [];
  
  // Parse package to get frequency and wash types
  const packageInfo = parsePackage(package);
  
  // Generate wash days for the week based on frequency
  const washDays = generateWashDays(packageInfo.frequency, customer.WashDay);
  
  washDays.forEach((day, index) => {
    const washType = determineWashType(
      packageInfo, 
      index, 
      allCarPlates, 
      carPlate, 
      history, 
      day
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
  
  return { frequency, hasInt, isBiWeek };
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

function determineWashType(packageInfo, visitIndex, allCarPlates, currentCarPlate, history, washDay) {
  // Rule 1: 'Ext Only' packages are always EXT
  if (!packageInfo.hasInt) {
    return 'EXT';
  }
  
  // Rule 2: For bi-week packages, INT only applies on first week of cycle
  if (packageInfo.isBiWeek) {
    const isFirstWeekOfCycle = checkIfFirstWeekOfBiWeekCycle(history);
    if (!isFirstWeekOfCycle) {
      return 'EXT';
    }
  }
  
  // Rule 3: Single car customers - INT on specific visits
  if (allCarPlates.length === 1) {
    return getSingleCarWashType(packageInfo.frequency, visitIndex);
  }
  
  // Rule 4: Multi-car customers - INT alternates between cars
  return getMultiCarWashType(allCarPlates, currentCarPlate, history);
}

function checkIfFirstWeekOfBiWeekCycle(history) {
  if (history.length === 0) return true;
  
  const lastWashDate = new Date(history[0].WashDate);
  const currentDate = new Date();
  const daysDiff = Math.floor((currentDate - lastWashDate) / (1000 * 60 * 60 * 24));
  
  // If last wash was more than 7 days ago, we're in first week of new cycle
  return daysDiff > 7;
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

function getMultiCarWashType(allCarPlates, currentCarPlate, history) {
  // Find last INT wash across all customer's cars to determine alternation
  const lastIntWash = findLastIntWashForCustomer(allCarPlates, history);
  
  if (!lastIntWash) {
    // No previous INT wash, give INT to first car alphabetically
    const sortedPlates = [...allCarPlates].sort();
    return currentCarPlate === sortedPlates[0] ? 'INT' : 'EXT';
  }
  
  // Alternate INT to different car than last time
  const currentCarIndex = allCarPlates.indexOf(currentCarPlate);
  const lastIntCarIndex = allCarPlates.indexOf(lastIntWash.CarPlate);
  const nextIntCarIndex = (lastIntCarIndex + 1) % allCarPlates.length;
  
  return currentCarIndex === nextIntCarIndex ? 'INT' : 'EXT';
}

function findLastIntWashForCustomer(allCarPlates, history) {
  // This would need to check history across all customer's cars
  // Simplified implementation - check current car's history
  return history.find(record => record.WashType === 'INT');
}

module.exports = {
  buildWeeklySchedule
};