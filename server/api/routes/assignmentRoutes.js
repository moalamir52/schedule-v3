const express = require('express');
const { autoAssignSchedule, addManualAppointment, getAvailableWorkers, getSchedule, updateTaskAssignment, deleteTask, batchUpdateTasks, syncNewCustomers, getWashHistory } = require('../controllers/assignmentController');

const router = express.Router();

router.post('/', autoAssignSchedule);
router.get('/current', getSchedule);
router.post('/:weekOffset', autoAssignSchedule);
router.post('/manual', addManualAppointment);
router.get('/available-workers', getAvailableWorkers);
router.put('/update-task', updateTaskAssignment);
router.post('/update-task', updateTaskAssignment);
router.delete('/delete-task', deleteTask);
router.delete('/manual/:customerId', deleteTask);
router.put('/batch-update', batchUpdateTasks);
router.put('/batch-update-tasks', batchUpdateTasks); // Alternative endpoint name
router.post('/sync-new-customers', syncNewCustomers);
router.post('/force-generate/:weekOffset', autoAssignSchedule);
router.get('/wash-history/:customerId', getWashHistory);

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Assignment routes working!' });
});

module.exports = router;