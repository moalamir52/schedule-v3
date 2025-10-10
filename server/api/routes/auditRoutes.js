const express = require('express');
const { getAuditReport, getDailyReport, getUserActivity } = require('../controllers/auditController');

const router = express.Router();

router.get('/logs', getAuditReport);
router.get('/daily', getDailyReport);
router.get('/user/:userId', getUserActivity);

module.exports = router;