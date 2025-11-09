// Fix workers routes import error
const fs = require('fs');
const path = require('path');

console.log('🚨 URGENT: Fixing Workers Routes');
console.log('================================');

// Fix workersRoutes.js
const routesPath = path.join(__dirname, 'api', 'routes', 'workersRoutes.js');

const fixedRoutes = `const express = require('express');
const router = express.Router();
const { getAllWorkers, addWorker, updateWorker, deleteWorker } = require('../controllers/workersController');

router.get('/', getAllWorkers);
router.post('/', addWorker);
router.put('/:id', updateWorker);
router.delete('/:id', deleteWorker);

module.exports = router;`;

fs.writeFileSync(routesPath, fixedRoutes);

console.log('✅ Workers routes fixed!');
console.log('🚀 Deploy immediately to fix server crash');

module.exports = { success: true };