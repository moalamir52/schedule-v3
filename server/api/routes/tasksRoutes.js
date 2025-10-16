const express = require('express');
const { getTodayTasks, completeTask, cancelTask, completeAllTasks } = require('../controllers/tasksController');

const router = express.Router();

router.get('/today', getTodayTasks);
router.post('/complete', completeTask);
router.post('/cancel', cancelTask);
router.post('/complete-all', completeAllTasks);

module.exports = router;