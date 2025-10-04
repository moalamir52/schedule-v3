const express = require('express');
const { getAllWorkers } = require('../controllers/workerController');

const router = express.Router();

router.get('/', getAllWorkers);

module.exports = router;