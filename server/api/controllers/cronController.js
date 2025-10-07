const cronService = require('../../services/cronService');

const getCronSettings = async (req, res) => {
  try {
    const settings = cronService.getSettings();
    res.json({
      success: true,
      settings
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateCronSettings = async (req, res) => {
  try {
    const { enabled, day, hour, minute } = req.body;
    
    const newSettings = {};
    if (typeof enabled === 'boolean') newSettings.enabled = enabled;
    if (typeof day === 'number' && day >= 0 && day <= 6) newSettings.day = day;
    if (typeof hour === 'number' && hour >= 0 && hour <= 23) newSettings.hour = hour;
    if (typeof minute === 'number' && minute >= 0 && minute <= 59) newSettings.minute = minute;
    
    cronService.updateSettings(newSettings);
    
    const updatedSettings = cronService.getSettings();
    
    res.json({
      success: true,
      message: 'Cron settings updated successfully',
      settings: updatedSettings
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const triggerManualRun = async (req, res) => {
  try {
    
    // Import here to avoid circular dependency
    const { autoAssignSchedule } = require('./assignmentController');
    
    const mockReq = { params: { weekOffset: '1' } };
    const mockRes = {
      json: (data) => {
        res.json({
          success: true,
          message: 'Manual schedule generation completed',
          totalAppointments: data.totalAppointments,
          assignments: data.assignments
        });
      },
      status: (code) => ({ 
        json: (data) => {
          res.status(code).json({
            success: false,
            error: data.error
          });
        }
      })
    };
    
    await autoAssignSchedule(mockReq, mockRes);
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getCronSettings,
  updateCronSettings,
  triggerManualRun
};