const express = require('express');
const router = express.Router();
const clientsController = require('../controllers/clientsController');

// Get next customer ID
router.get('/next-id', clientsController.getNextCustomerId);

// Get all clients
router.get('/', clientsController.getAllClients);

// Create new client
router.post('/', clientsController.createClient);

// Update client
router.put('/:id', clientsController.updateClient);

// Delete client
router.delete('/:id', clientsController.deleteClient);

module.exports = router;