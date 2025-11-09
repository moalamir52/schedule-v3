const express = require('express');
const { getTodayTasks, completeTask, cancelTask, completeAllTasks, getDebugStatus, forceCleanup } = require('../controllers/tasksControllerOptimized');

const router = express.Router();

router.get('/today', getTodayTasks);
router.get('/debug-status', getDebugStatus);
router.post('/complete', completeTask);
router.post('/cancel', cancelTask);
router.post('/complete-all', completeAllTasks);
router.post('/force-cleanup', forceCleanup);

module.exports = router;