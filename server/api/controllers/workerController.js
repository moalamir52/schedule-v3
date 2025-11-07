const db = require('../../services/databaseService');

const getAllWorkers = async (req, res) => {
  try {
    const workers = await db.getWorkers();
    const activeWorkers = workers.filter(worker => worker.Status === 'Active');
    res.status(200).json(activeWorkers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAllWorkers };