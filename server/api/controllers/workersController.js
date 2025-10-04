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
    const { name, job, status } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Worker name is required' });
    }

    const workers = await getWorkers();
    const workerIds = workers.map(w => {
      const id = w.WorkerID || w.workerId || '';
      if (typeof id === 'string' && id.startsWith('WORK-')) {
        return parseInt(id.replace('WORK-', '')) || 0;
      }
      return parseInt(id) || 0;
    });
    const nextId = Math.max(...workerIds, 0) + 1;
    
    const newWorker = {
      WorkerID: `WORK-${nextId.toString().padStart(3, '0')}`,
      Name: name.trim(),
      Job: job || 'Car Washer',
      Status: status || 'Active'
    };
    
    await addWorkerToSheet(newWorker);
    
    res.json({ success: true, worker: newWorker });
  } catch (error) {
    console.error('Error adding worker:', error);
    res.status(500).json({ error: error.message });
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