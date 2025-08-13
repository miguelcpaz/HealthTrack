const express = require('express');
const { registerUser, loginUser,getFuncionariosByHospital } = require('../controllers/userController');

const router = express.Router();

// Cadastro
router.post('/register', registerUser);

router.get('/get/:id', getFuncionariosByHospital);

// Login
router.post('/login', loginUser);

module.exports = router;
