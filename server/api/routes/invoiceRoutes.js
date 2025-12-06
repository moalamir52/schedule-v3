const express = require('express');
const router = express.Router();
const { 
  createInvoice, 
  getAllInvoices, 
  updateInvoice, 
  deleteInvoice, 
  exportInvoices, 
  printInvoice,
  getInvoiceNumber,
  getInvoiceStats,
  checkDuplicateInvoices,
  getClientsSummary
} = require('../controllers/invoiceController');

router.post('/', createInvoice);
router.post('/create', createInvoice);
router.post('/get-number', getInvoiceNumber);
router.get('/stats', getInvoiceStats);
router.get('/check-duplicates', checkDuplicateInvoices);
router.get('/clients-summary', getClientsSummary);
router.get('/all', getAllInvoices);
router.get('/', getAllInvoices);
router.get('/export', exportInvoices);
router.get('/print/:id', printInvoice);
router.put('/update/:id', updateInvoice);
router.delete('/delete/:id', deleteInvoice);
router.put('/:id', updateInvoice);
router.delete('/:id', deleteInvoice);

module.exports = router;