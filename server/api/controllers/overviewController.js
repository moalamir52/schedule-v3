const { getCustomers, getWorkers } = require('../../services/googleSheetsService');

const getScheduleOverview = async (req, res) => {
  try {
    // Fetch active workers to determine total capacity
    const workers = await getWorkers();
    const totalCapacity = workers.filter(worker => worker.Status === 'Active').length;
    
    // Fetch all customers
    const customers = await getCustomers();
    
    // Initialize data structures
    const appointments = [];
    const days = ['Saturday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const timeSlots = [
      '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
      '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'
    ];
    
    // Loop through each customer and parse appointments
    customers.forEach(customer => {
      if (!customer || customer.Status !== 'Active') {
        return;
      }
      
      const timeField = customer.Time || '';
      const daysField = customer.Days || '';
      const notesField = customer.Notes || '';
      
      const customerAppointments = [];
      
      // Priority 1: Check for specific day-and-time definitions
      const specificPattern = /(Sat|Mon|Tue|Wed|Thu|Thurs|Fri)[@\s]*(at\s*)?(\d{1,2}:\d{2}\s*(AM|PM))/gi;
      const specificMatches = [];
      
      // Parse Time field for specific overrides
      let match;
      while ((match = specificPattern.exec(timeField)) !== null) {
        specificMatches.push({
          day: expandDayName(match[1]),
          time: match[3]
        });
      }
      
      // Parse Notes field for specific overrides
      specificPattern.lastIndex = 0;
      while ((match = specificPattern.exec(notesField)) !== null) {
        specificMatches.push({
          day: expandDayName(match[1]),
          time: match[3]
        });
      }
      
      // Always start with standard schedule (Priority 3)
      if (timeField.includes('&')) {
        // Priority 2: Multiple times per day
        const times = timeField.split('&').map(t => t.trim());
        const customerDays = parseDaysField(daysField);
        
        customerDays.forEach(day => {
          if (days.includes(day)) {
            times.forEach(time => {
              if (timeSlots.includes(time)) {
                const apt = {
                  day: day,
                  time: time,
                  customerId: customer.CustomerID
                };
                appointments.push(apt);
                customerAppointments.push(apt);
              }
            });
          }
        });
      } else if (daysField && timeField) {
        // Standard schedule: Create appointments for all days at the standard time
        const customerDays = parseDaysField(daysField);
        const time = timeField.trim();
        
        customerDays.forEach(day => {
          if (days.includes(day) && timeSlots.includes(time)) {
            const apt = {
              day: day,
              time: time,
              customerId: customer.CustomerID
            };
            appointments.push(apt);
            customerAppointments.push(apt);
          }
        });
      }
      
      // Now handle Notes overrides - these modify or add to the standard schedule
      if (specificMatches.length > 0) {
        specificMatches.forEach(appointment => {
          if (days.includes(appointment.day) && timeSlots.includes(appointment.time)) {
            // Remove existing appointment for this day if it exists
            const existingIndex = appointments.findIndex(apt => 
              apt.customerId === customer.CustomerID && apt.day === appointment.day
            );
            if (existingIndex !== -1) {
              appointments.splice(existingIndex, 1);
              const custIndex = customerAppointments.findIndex(apt => apt.day === appointment.day);
              if (custIndex !== -1) customerAppointments.splice(custIndex, 1);
            }
            
            // Add the new appointment with override time
            const apt = {
              day: appointment.day,
              time: appointment.time,
              customerId: customer.CustomerID
            };
            appointments.push(apt);
            customerAppointments.push(apt);
          }
        });
      }
    });
    
    // Initialize counts object
    const counts = {};
    days.forEach(day => {
      counts[day] = {};
      timeSlots.forEach(time => {
        counts[day][time] = 0;
      });
    });
    
    // Count appointments for each day and time slot
    appointments.forEach(appointment => {
      if (counts[appointment.day] && counts[appointment.day][appointment.time] !== undefined) {
        counts[appointment.day][appointment.time]++;
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