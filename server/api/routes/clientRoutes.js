const express = require('express');
const { 
  getAllClients, 
  createClient, 
  updateClient, 
  deleteClient, 
  restoreClient, 
  searchClients,
  getNextCustomerId
} = require('../controllers/clientController');

const router = express.Router();

router.get('/', getAllClients);
router.get('/available', getAllClients);
router.get('/next-id', getNextCustomerId);
router.get('/search', searchClients);
router.get('/:customerId', require('../controllers/clientsController').getCustomerById);
router.post('/', createClient);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);
router.post('/restore', restoreClient);

module.exports = router;