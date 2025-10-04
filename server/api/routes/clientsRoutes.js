const express = require('express');
const router = express.Router();
const { getAvailableClients } = require('../controllers/clientsController');

router.get('/available', getAvailableClients);

module.exports = router;