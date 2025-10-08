const express = require('express');
const router = express.Router();
const { getAvailableClients, getCustomerById } = require('../controllers/clientsController');

router.get('/available', getAvailableClients);
router.get('/:customerId', getCustomerById);

module.exports = router;