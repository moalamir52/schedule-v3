const express = require('express');
const { autoAssignSchedule, addManualAppointment, getAvailableWorkers, getSchedule, updateTaskAssignment, deleteTask, batchUpdateTasks, syncNewCustomers, getWashHistory, clearAllScheduleData, getSkippedCustomers } = require('../controllers/assignmentController');

const router = express.Router();

router.post('/manual', addManualAppointment);
router.post('/sync-new-customers', syncNewCustomers);
router.post('/', autoAssignSchedule);
router.get('/current', getSchedule);
router.post('/:weekOffset', autoAssignSchedule);
router.get('/available-workers', getAvailableWorkers);
router.put('/update-task', updateTaskAssignment);
router.post('/update-task', updateTaskAssignment);
router.delete('/clear-all', clearAllScheduleData);
router.delete('/delete-task', deleteTask);
router.delete('/manual/:customerId', deleteTask);
router.delete('/:customerId', deleteTask);
router.put('/batch-update', (req, res, next) => {
  batchUpdateTasks(req, res, next);
});
router.put('/batch-update-tasks', batchUpdateTasks); // Alternative endpoint name
router.post('/force-generate/:weekOffset', autoAssignSchedule);
router.post('/smart/:weekOffset', require('../controllers/autoScheduleController').smartAutoSchedule);
router.post('/force-reset/:weekOffset', require('../controllers/autoScheduleController').forceResetAll);
router.get('/wash-history/:customerId', getWashHistory);
router.get('/history/:customerId', getWashHistory); // Alternative route
router.get('/skipped-customers', getSkippedCustomers);

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Assignment routes working!' });
});

// Test batch-update endpoint
router.put('/test-batch', (req, res) => {
  res.json({ success: true, message: 'Test batch endpoint working!' });
});

// Debug endpoint
router.get('/routes', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Available routes',
    routes: ['DELETE /clear-all']
  });
});

// Alternative clear endpoint - must be before other routes
router.post('/reset-all-data', clearAllScheduleData);
router.delete('/reset-schedule-data', clearAllScheduleData);

module.exports = router;