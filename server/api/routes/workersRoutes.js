const express = require('express');
const router = express.Router();
const { getAllWorkers, addWorker, updateWorker, deleteWorker } = require('../controllers/workersController');

router.get('/', getAllWorkers);
router.post('/', addWorker);
router.put('/:id', updateWorker);
router.delete('/:id', deleteWorker);

module.exports = router;