const express = require('express');
const { getDebugInfo, getLogs, clearLogs, getAssignmentStats, validateSchedule } = require('../controllers/debugController');

const router = express.Router();

router.get('/info', getDebugInfo);
router.get('/logs', getLogs);
router.get('/validate-schedule', validateSchedule);
router.post('/logs/clear', clearLogs);
router.get('/assignment-stats', getAssignmentStats);

module.exports = router;