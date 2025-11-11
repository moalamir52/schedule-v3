const express = require('express');
const router = express.Router();
const { syncWorkerIds, fixSingleTask } = require('../controllers/syncController');

// مزامنة جميع معرفات العمال
router.post('/worker-ids', syncWorkerIds);

// إصلاح مهمة واحدة محددة
router.post('/fix-task', fixSingleTask);

module.exports = router;