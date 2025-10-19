const express = require('express');
const { checkAndGenerateNewWeek, forceGenerateWeek } = require('../controllers/autoScheduleController');

const router = express.Router();

router.get('/check-new-week', checkAndGenerateNewWeek);
router.post('/force-generate', forceGenerateWeek);

module.exports = router;