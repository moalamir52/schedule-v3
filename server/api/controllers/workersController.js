const { getWorkers, addWorkerToSheet, deleteWorkerFromSheet } = require('../../services/googleSheetsService');

const getWorkersAPI = async (req, res) => {
  try {
    const workers = await getWorkers();
    res.json(workers);
  } catch (error) {
    console.error('Error getting workers:', error);
    res.status(500).json({ error: error.message });
  }
};

const addWorker = async (req, res) => {
  try {
    console.log('[CONTROLLER] Add worker request received:', req.body);
    const { name, job, status } = req.body;
    
    if (!name) {
      console.log('[CONTROLLER] Worker name is missing');
      return res.status(400).json({ error: 'Worker name is required' });
    }

    console.log('[CONTROLLER] Getting existing workers...');
    const workers = await getWorkers();
    console.log('[CONTROLLER] Found', workers.length, 'existing workers');
    
    // Check if worker already exists
    const existingWorker = workers.find(w => 
      (w.Name || w.WorkerName || '').toLowerCase() === name.trim().toLowerCase()
    );
    
    if (existingWorker) {
      console.log('[CONTROLLER] Worker already exists:', name);
      return res.status(400).json({ error: 'Worker already exists' });
    }
    
    const workerIds = workers.map(w => {
      const id = w.WorkerID || w.workerId || '';
      if (typeof id === 'string' && id.startsWith('WORK-')) {
        return parseInt(id.replace('WORK-', '')) || 0;
      }
      return parseInt(id) || 0;
    });
    const nextId = Math.max(...workerIds, 0) + 1;
    console.log('[CONTROLLER] Next worker ID will be:', nextId);
    
    const newWorker = {
      WorkerID: `WORK-${nextId.toString().padStart(3, '0')}`,
      Name: name.trim(),
      Job: job || 'Car Washer',
      Status: status || 'Active'
    };
    
    console.log('[CONTROLLER] New worker object:', newWorker);
    console.log('[CONTROLLER] Calling addWorkerToSheet...');
    await addWorkerToSheet(newWorker);
    console.log('[CONTROLLER] Worker added successfully!');
    
    res.json({ success: true, worker: newWorker, message: 'Worker added successfully' });
  } catch (error) {
    console.error('[CONTROLLER] Error adding worker:', error);
    res.status(500).json({ error: error.message || 'Failed to add worker' });
  }
};

const deleteWorker = async (req, res) => {
  try {
    const { name } = req.params;
    
    if (!name) {
      return res.status(400).json({ error: 'Worker name is required' });
    }

    await deleteWorkerFromSheet(name);
    
    res.json({ success: true, message: 'Worker deleted successfully' });
  } catch (error) {
    console.error('Error deleting worker:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getWorkers: getWorkersAPI, addWorker, deleteWorker };