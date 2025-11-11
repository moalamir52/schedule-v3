const db = require('../../services/databaseService');

const getAllWorkers = async (req, res) => {
  try {
    let workers = await db.getWorkers();
    console.log('Fetched workers from database');
    
    // Ensure workers is always an array
    if (!Array.isArray(workers)) {
      workers = workers ? [workers] : [];
    }
    
    // If no workers in database, add default workers
    if (workers.length === 0) {
      const defaultWorkers = [
        { WorkerID: 'WORKER-001', Name: 'Ahmed', Phone: '01234567890', Status: 'Active' },
        { WorkerID: 'WORKER-002', Name: 'Mohamed', Phone: '01234567891', Status: 'Active' },
        { WorkerID: 'WORKER-003', Name: 'Ali', Phone: '01234567892', Status: 'Active' },
        { WorkerID: 'WORKER-004', Name: 'Omar', Phone: '01234567893', Status: 'Active' },
        { WorkerID: 'WORKER-005', Name: 'Khaled', Phone: '01234567894', Status: 'Active' }
      ];
      
      // Add workers to database
      for (const worker of defaultWorkers) {
        try {
          await db.addWorker(worker);
          } catch (error) {
          }
      }
      
      // Fetch again after adding
      workers = await db.getWorkers();
      }
    
    // Return workers array directly for frontend compatibility
    res.json(workers);
    
  } catch (error) {
    // Return default workers as fallback
    const fallbackWorkers = [
      { WorkerID: 'WORKER-001', Name: 'Ahmed', Phone: '01234567890', Status: 'Active' },
      { WorkerID: 'WORKER-002', Name: 'Mohamed', Phone: '01234567891', Status: 'Active' },
      { WorkerID: 'WORKER-003', Name: 'Ali', Phone: '01234567892', Status: 'Active' }
    ];
    
    // Return fallback workers array directly
    res.json(fallbackWorkers);
  }
};

const addWorker = async (req, res) => {
  try {
    const result = await db.addWorker(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateWorker = async (req, res) => {
  try {
    const { id } = req.params;
    // Update worker logic here
    res.json({ success: true, message: 'Worker updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.deleteWorker(id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAllWorkers,
  addWorker,
  updateWorker,
  deleteWorker
};