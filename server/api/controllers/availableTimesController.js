const getAvailableTimes = async (req, res) => {
  try {
    const { day } = req.query;
    
    if (!day) {
      return res.status(400).json({ error: 'Day parameter is required' });
    }
    
    const logicService = require('../../services/logicService');
    const availableTimes = await logicService.getAvailableTimesForDay(day, 0);
    
    res.json({ availableTimes });
    
  } catch (error) {
    console.error('[AVAILABLE-TIMES] Error:', error);
    res.status(500).json({ error: 'Failed to get available times' });
  }
};

// Helper function to parse time slots (same as in logicService)
function parseTimeSlots(timeString) {
  if (!timeString) return [];
  
  const timePattern = /\d{1,2}:\d{2}\s*[AP]M/gi;
  const matches = timeString.match(timePattern);
  
  if (matches && matches.length > 0) {
    return [...new Set(matches.map(time => time.trim()))];
  }
  
  return [timeString.trim()];
}

module.exports = {
  getAvailableTimes
};