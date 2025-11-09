const express = require('express');
const router = express.Router();
const { getCompletedTasks, removeCompletedTasks } = require('../controllers/completedTasksController');

// GET /api/completed-tasks - Get all completed tasks
router.get('/', getCompletedTasks);

// POST /api/completed-tasks/remove - Remove completed tasks from schedule
router.post('/remove', removeCompletedTasks);

module.exports = router;