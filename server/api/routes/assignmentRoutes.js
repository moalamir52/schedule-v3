const express = require('express');
const { autoAssignSchedule, addManualAppointment, getAvailableWorkers, getSchedule, updateTaskAssignment, deleteTask, batchUpdateTasks, syncNewCustomers } = require('../controllers/assignmentController');

const router = express.Router();

router.post('/', autoAssignSchedule);
router.get('/current', getSchedule);
router.post('/:weekOffset', autoAssignSchedule);
router.post('/manual', addManualAppointment);
router.get('/available-workers', getAvailableWorkers);
router.put('/update-task', updateTaskAssignment);
router.post('/update-task', updateTaskAssignment);
router.delete('/delete-task', deleteTask);
router.put('/batch-update', batchUpdateTasks);
router.put('/batch-update-tasks', batchUpdateTasks); // Alternative endpoint name
router.post('/sync-new-customers', syncNewCustomers);

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Assignment routes working!' });
});

module.exports = router;