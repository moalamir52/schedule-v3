const express = require('express');
const { getTodayTasks, completeTask } = require('../controllers/tasksController');

const router = express.Router();

router.get('/today', getTodayTasks);
router.post('/complete', completeTask);

module.exports = router;