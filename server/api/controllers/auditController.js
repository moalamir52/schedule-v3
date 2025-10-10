const { getAuditLogs } = require('../../services/googleSheetsService');

const getAuditReport = async (req, res) => {
  try {
    const { userId, action, customerID, dateFrom, dateTo, limit = 100 } = req.query;
    
    const filters = {};
    if (userId) filters.userId = userId;
    if (action) filters.action = action;
    if (customerID) filters.customerID = customerID;
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
    
    let logs = await getAuditLogs(filters);
    
    // Limit results
    if (limit && logs.length > parseInt(limit)) {
      logs = logs.slice(0, parseInt(limit));
    }
    
    res.json({
      success: true,
      message: `Found ${logs.length} audit records`,
      logs,
      filters
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getDailyReport = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const filters = {
      dateFrom: `${targetDate}T00:00:00.000Z`,
      dateTo: `${targetDate}T23:59:59.999Z`
    };
    
    const logs = await getAuditLogs(filters);
    
    // Group by action type
    const summary = {
      taskUpdates: logs.filter(log => log.Action === 'TASK_UPDATE').length,
      manualAppointments: logs.filter(log => log.Action === 'MANUAL_APPOINTMENT_ADD').length,
      slotSwaps: logs.filter(log => log.Action === 'SLOT_SWAP').length,
      totalChanges: logs.length
    };
    
    res.json({
      success: true,
      message: `Daily report for ${targetDate}`,
      date: targetDate,
      summary,
      logs
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getUserActivity = async (req, res) => {
  try {
    const { userId } = req.params;
    const { dateFrom, dateTo } = req.query;
    
    const filters = { userId };
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
    
    const logs = await getAuditLogs(filters);
    
    // Group by action type
    const activitySummary = logs.reduce((acc, log) => {
      acc[log.Action] = (acc[log.Action] || 0) + 1;
      return acc;
    }, {});
    
    res.json({
      success: true,
      message: `Activity report for user ${userId}`,
      userId,
      totalActions: logs.length,
      activitySummary,
      logs
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAuditReport,
  getDailyReport,
  getUserActivity
};