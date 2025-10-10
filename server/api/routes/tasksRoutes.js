const express = require('express');
const { getTodayTasks, completeTask, completeAllTasks } = require('../controllers/tasksController');

const router = express.Router();

router.get('/today', getTodayTasks);
router.post('/complete', completeTask);
router.post('/complete-all', completeAllTasks);

module.exports = router;