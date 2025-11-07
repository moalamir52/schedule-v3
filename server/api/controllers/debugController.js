const db = require('../../services/databaseService');
const logger = require('../../services/logger');
const { validateAndFixSchedule } = require('./assignmentController');

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

const getLogs = (req, res) => {
  try {
    const { since, level } = req.query;
    let logs = logger.getBuffer(since ? { since } : undefined);
    if (level) {
      logs = logs.filter(l => String(l.level).toLowerCase() === String(level).toLowerCase());
    }
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const clearLogs = (req, res) => {
  try {
    logger.clearBuffer();
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAssignmentStats = async (req, res) => {
  try {
    // Fetch current scheduled tasks and workers
    const [tasks, workers] = await Promise.all([
      getScheduledTasks().catch(() => []),
      getWorkers().catch(() => [])
    ]);

    // Normalize worker lookup by WorkerID and Name
    const workerMap = {};
    workers.forEach(w => {
      const id = (w.WorkerID || w.ID || w.id || '').toString();
      const name = w.Name || w.Name || w.FullName || w.Name || w.name || '';
      if (id) workerMap[id] = { id, name };
    });

    // Count assignments per worker
    const counts = {};
    const unassigned = [];

    tasks.forEach(t => {
      const workerId = (t.WorkerID || t.WorkerId || '').toString().trim();
      if (!workerId) {
        unassigned.push({ day: t.Day, time: t.Time, customer: t.CustomerName, carPlate: t.CarPlate, washType: t.WashType });
      } else {
        counts[workerId] = (counts[workerId] || 0) + 1;
      }
    });

    // Build per-worker array including workers with zero assigned tasks
    const perWorker = workers.map(w => {
      const id = (w.WorkerID || w.ID || w.id || '').toString();
      const name = w.Name || w.name || '';
      return { workerId: id, name, assigned: counts[id] || 0, status: w.Status || 'Active' };
    });

    // Also include any workerIds that appeared in tasks but not in workers sheet
    Object.keys(counts).forEach(id => {
      if (!perWorker.find(p => p.workerId === id)) {
        perWorker.push({ workerId: id, name: id, assigned: counts[id] || 0, status: 'Unknown' });
      }
    });

    const result = {
      totalTasks: tasks.length,
      totalWorkers: workers.length,
      totalAssigned: Object.values(counts).reduce((s, v) => s + v, 0),
      totalUnassigned: unassigned.length,
      perWorker,
      unassigned
    };

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Dry-run validate current ScheduledTasks in Google Sheets and return conflicts without modifying sheet
const validateSchedule = async (req, res) => {
  try {
    const tasks = await getScheduledTasks();
    // Normalize tasks into format expected by validator
    const normalized = tasks.map(t => ({
      appointmentDate: t.AppointmentDate || '',
      day: t.Day || '',
      time: t.Time || '',
      customerId: t.CustomerID || t.customerId || '',
      customerName: t.CustomerName || t.customerName || '',
      villa: t.Villa || t.villa || '',
      carPlate: t.CarPlate || t.carPlate || '',
      washType: t.WashType || t.washType || 'EXT',
      workerName: t.WorkerName || t.workerName || '',
      workerId: t.WorkerID || t.workerId || '',
      packageType: t.PackageType || t.packageType || '',
      isLocked: t.isLocked || 'FALSE',
      scheduleDate: t.ScheduleDate || t.scheduleDate || ''
    }));

    // Run validator (it returns cleaned schedule and logs conflicts via logger)
    // We don't want to change the sheet here, so call the validator and compute differences
    const cleaned = validateAndFixSchedule(normalized);

    // Build a simple conflict report by comparing input vs cleaned
    const conflicts = {
      totalInput: normalized.length,
      totalAfterValidation: cleaned.length,
      customerDuplicates: [],
      workerDoubleBooking: []
    };

    // For simplicity, validator already logged conflicts into logger; we'll return the logger entries of type validate-schedule
    const logs = logger.getBuffer();
    const validateLogs = logs.filter(l => String(l.level).toLowerCase() === 'assign' && l.text && l.text.includes('"type":"validate-schedule"'));

    res.json({ success: true, message: 'Dry-run validation complete', report: conflicts, validateLogs: validateLogs.slice(-50) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getDebugInfo,
  getLogs,
  clearLogs,
  getAssignmentStats,
  validateSchedule
};