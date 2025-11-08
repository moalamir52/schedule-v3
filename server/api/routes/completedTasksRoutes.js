const express = require('express');
const router = express.Router();
const { removeCompletedTasks } = require('../controllers/completedTasksController');

// POST /api/completed-tasks/remove - Remove completed tasks from schedule
router.post('/remove', removeCompletedTasks);

module.exports = router;