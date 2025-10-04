const { getWorkers } = require('../../services/googleSheetsService');

const getAllWorkers = async (req, res) => {
  try {
    const workers = await getWorkers();
    const activeWorkers = workers.filter(worker => worker.Status === 'Active');
    res.status(200).json(activeWorkers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAllWorkers };