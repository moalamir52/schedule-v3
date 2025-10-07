const express = require('express');
const { getCronSettings, updateCronSettings, triggerManualRun } = require('../controllers/cronController');

const router = express.Router();

router.get('/settings', getCronSettings);
router.put('/settings', updateCronSettings);
router.post('/trigger', triggerManualRun);

module.exports = router;