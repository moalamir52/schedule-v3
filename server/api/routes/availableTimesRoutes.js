const express = require('express');
const router = express.Router();
const { getAvailableTimes } = require('../controllers/availableTimesController');

router.get('/times', getAvailableTimes);

module.exports = router;