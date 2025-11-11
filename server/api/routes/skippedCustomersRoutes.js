const express = require('express');
const router = express.Router();
const { 
  addSkippedCustomer, 
  getSkippedCustomers, 
  deleteSkippedCustomer, 
  clearAllSkippedCustomers 
} = require('../controllers/skippedCustomersController');

// جلب جميع العملاء المتخطين
router.get('/', getSkippedCustomers);

// إضافة عميل متخطي
router.post('/', addSkippedCustomer);

// حذف سجل عميل متخطي
router.delete('/:skippedId', deleteSkippedCustomer);

// مسح جميع السجلات
router.delete('/clear/all', clearAllSkippedCustomers);

module.exports = router;