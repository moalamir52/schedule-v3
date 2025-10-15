const express = require('express');
const { autoAssignSchedule, addManualAppointment, getAvailableWorkers, getSchedule, updateTaskAssignment, cancelBooking, batchUpdateTasks } = require('../controllers/assignmentController');

const router = express.Router();

router.post('/', autoAssignSchedule);
router.get('/current', getSchedule);
router.post('/:weekOffset', autoAssignSchedule);
router.post('/manual', addManualAppointment);
router.get('/available-workers', getAvailableWorkers);
router.put('/update-task', (req, res, next) => {
  console.log('[ROUTE] PUT /update-task called');
  next();
}, updateTaskAssignment);
router.post('/update-task', (req, res, next) => {
  console.log('[ROUTE] POST /update-task called');
  next();
}, updateTaskAssignment);
router.post('/cancel-booking', cancelBooking);
router.put('/batch-update', batchUpdateTasks);

module.exports = router;