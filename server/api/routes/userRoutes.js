const express = require('express');
const { getAllUsers, createUser, updateUserRole, deleteUserById, changeUserPassword, resetUserPassword, changeMyPassword } = require('../controllers/userController');

const router = express.Router();

router.get('/', getAllUsers);
router.post('/', createUser);
router.put('/:id', updateUserRole);
router.put('/:id/password', changeUserPassword);
router.put('/:id/reset-password', resetUserPassword);
router.put('/change-my-password', changeMyPassword);
router.delete('/:id', deleteUserById);

module.exports = router;