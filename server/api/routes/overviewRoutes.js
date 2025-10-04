const express = require('express');
const { getScheduleOverview } = require('../controllers/overviewController');

const router = express.Router();

router.get('/', getScheduleOverview);

module.exports = router;