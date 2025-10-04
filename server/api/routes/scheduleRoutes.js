const express = require('express');
const { getWeeklySchedule } = require('../controllers/scheduleController');

const router = express.Router();

router.get('/', getWeeklySchedule);

module.exports = router;