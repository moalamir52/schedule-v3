const express = require('express');
const { autoAssignSchedule, addManualAppointment, getAvailableWorkers, getSchedule, deleteManualAppointment, exportSchedule, updateWashType } = require('../controllers/assignmentController');

const router = express.Router();

router.post('/', autoAssignSchedule);
router.get('/current', getSchedule);
router.post('/week/:weekOffset', autoAssignSchedule);
router.post('/manual', addManualAppointment);
router.delete('/manual/:customerId', deleteManualAppointment);
router.get('/export', exportSchedule);
router.get('/available-workers', getAvailableWorkers);
router.put('/update-wash-type', updateWashType);

module.exports = router;