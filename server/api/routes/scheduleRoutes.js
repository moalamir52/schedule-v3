const express = require('express');
const { getWeeklySchedule, refreshSchedule, saveSchedule, updateTask, batchUpdate } = require('../controllers/scheduleController');

const router = express.Router();

router.get('/', getWeeklySchedule);
router.post('/refresh', refreshSchedule);
router.post('/save', saveSchedule);
router.put('/task/:taskId', updateTask);
router.post('/assign/batch-update', batchUpdate);

module.exports = router;