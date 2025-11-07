const express = require('express');
const { autoAssignSchedule, addManualAppointment, getAvailableWorkers, getSchedule, updateTaskAssignment, deleteTask, batchUpdateTasks, syncNewCustomers, getWashHistory, clearAllScheduleData } = require('../controllers/assignmentController');

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
  console.log('\n' + '='.repeat(60));
  console.log('[ROUTE] 🎯 BATCH-UPDATE ROUTE HIT!');
  console.log('[ROUTE] URL:', req.url);
  console.log('[ROUTE] Method:', req.method);
  console.log('[ROUTE] Headers:', req.headers);
  console.log('[ROUTE] Body:', JSON.stringify(req.body, null, 2));
  console.log('[ROUTE] About to call batchUpdateTasks function...');
  console.log('='.repeat(60));
  batchUpdateTasks(req, res, next);
});
router.put('/batch-update-tasks', batchUpdateTasks); // Alternative endpoint name
router.post('/force-generate/:weekOffset', autoAssignSchedule);
router.post('/smart/:weekOffset', require('../controllers/autoScheduleController').smartAutoSchedule);
router.post('/force-reset/:weekOffset', require('../controllers/autoScheduleController').forceResetAll);
router.get('/wash-history/:customerId', getWashHistory);
router.get('/history/:customerId', getWashHistory); // Alternative route

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Assignment routes working!' });
});

// Test batch-update endpoint
router.put('/test-batch', (req, res) => {
  console.log('[TEST-BATCH] 🎯 Test batch endpoint hit!');
  console.log('[TEST-BATCH] Method:', req.method);
  console.log('[TEST-BATCH] Body:', req.body);
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