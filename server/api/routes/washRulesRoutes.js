const express = require('express');
const router = express.Router();
const { getWashRules, saveWashRules, addWashRule, updateWashRule, deleteWashRule } = require('../controllers/washRulesController');

// Get all wash rules
router.get('/', getWashRules);

// Save all wash rules
router.post('/', saveWashRules);

// Add new wash rule
router.post('/add', addWashRule);

// Update wash rule
router.put('/:index', updateWashRule);

// Delete wash rule
router.delete('/:index', deleteWashRule);

module.exports = router;