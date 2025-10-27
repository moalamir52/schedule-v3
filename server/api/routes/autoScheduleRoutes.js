const express = require('express');
const { checkAndGenerateNewWeek, forceGenerateWeek, smartAutoSchedule, forceResetAll } = require('../controllers/autoScheduleController');

const router = express.Router();

router.get('/check-new-week', checkAndGenerateNewWeek);
router.post('/force-generate', forceGenerateWeek);
router.post('/smart/:weekOffset', smartAutoSchedule);
router.post('/force-reset/:weekOffset', forceResetAll);

module.exports = router;