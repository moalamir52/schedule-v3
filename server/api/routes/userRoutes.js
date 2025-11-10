const express = require('express');
const { getUsers, addUser, deleteUser } = require('../controllers/authController');

const router = express.Router();

router.get('/', getUsers);
router.post('/', addUser);
router.delete('/:username', deleteUser);

module.exports = router;