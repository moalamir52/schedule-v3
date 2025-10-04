const express = require('express');
const router = express.Router();
const { getWorkers, addWorker, deleteWorker } = require('../controllers/workersController');

router.get('/', getWorkers);
router.post('/', addWorker);
router.delete('/:name', deleteWorker);

module.exports = router;