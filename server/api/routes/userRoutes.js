const express = require('express');
const { getAllUsers, updateUserRole, deleteUserById, changeUserPassword, resetUserPassword, changeMyPassword } = require('../controllers/userController');

const router = express.Router();

router.get('/', getAllUsers);
router.put('/:id', updateUserRole);
router.put('/:id/password', changeUserPassword);
router.put('/:id/reset-password', resetUserPassword);
router.put('/change-my-password', changeMyPassword);
router.delete('/:id', deleteUserById);

module.exports = router;