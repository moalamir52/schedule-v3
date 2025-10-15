const express = require('express');
const { getDebugInfo } = require('../controllers/debugController');

const router = express.Router();

router.get('/info', getDebugInfo);

module.exports = router;