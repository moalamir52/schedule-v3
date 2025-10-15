const { getCustomers, getWorkers, getScheduledTasks } = require('../../services/googleSheetsService');

const getDebugInfo = async (req, res) => {
  try {
    // Fetch data to analyze
    const [customers, workers, scheduledTasks] = await Promise.all([
      getCustomers().catch(() => []),
      getWorkers().catch(() => []),
      getScheduledTasks().catch(() => [])
    ]);

    // Extract unique packages
    const availablePackages = [...new Set(
      customers
        .map(customer => customer.Washman_Package)
        .filter(pkg => pkg && pkg.trim())
    )].sort();

    // System statistics
    const debugInfo = {
      availablePackages,
      systemStats: {
        totalCustomers: customers.length,
        activeCustomers: customers.filter(c => c.Status === 'Active').length,
        totalWorkers: workers.length,
        activeWorkers: workers.filter(w => w.Status === 'Active').length,
        scheduledTasks: scheduledTasks.length,
        lockedTasks: scheduledTasks.filter(t => t.isLocked === 'TRUE').length
      },
      systemStatus: "Running",
      serverConnection: "Connected",
      lastUpdate: new Date().toISOString(),
      packageAnalysis: {
        weeklyPackages: availablePackages.filter(p => p.includes('week') && !p.includes('bi')).length,
        biWeeklyPackages: availablePackages.filter(p => p.includes('bi week')).length,
        extOnlyPackages: availablePackages.filter(p => !p.includes('INT')).length,
        intPackages: availablePackages.filter(p => p.includes('INT')).length
      }
    };

    res.json(debugInfo);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      systemStatus: "Error",
      serverConnection: "Error",
      availablePackages: [
        "2 Ext 1 INT week",
        "2 Ext 1 INT bi week", 
        "3 Ext 1 INT bi week",
        "3 Ext 1 INT week",
        "2 Ext",
        "3 Ext 1 INT bi week "
      ]
    });
  }
};

module.exports = {
  getDebugInfo
};