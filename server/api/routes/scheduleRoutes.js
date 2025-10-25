const express = require('express');
const { getWeeklySchedule, refreshSchedule, saveSchedule, updateTask } = require('../controllers/scheduleController');

const router = express.Router();

router.get('/', getWeeklySchedule);
router.post('/refresh', refreshSchedule);
router.post('/save', saveSchedule);
router.put('/task/:taskId', updateTask);

module.exports = router;