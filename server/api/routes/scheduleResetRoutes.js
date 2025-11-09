const express = require('express');
const { resetSchedule, clearSchedule } = require('../controllers/scheduleResetController');

const router = express.Router();

router.post('/reset', resetSchedule);
router.post('/clear', clearSchedule);

module.exports = router;