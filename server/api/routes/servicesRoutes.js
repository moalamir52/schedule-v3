const express = require('express');
const router = express.Router();
const { getServices, addService, deleteService } = require('../controllers/servicesController');

router.get('/', getServices);
router.post('/', addService);
router.delete('/:name', deleteService);

module.exports = router;