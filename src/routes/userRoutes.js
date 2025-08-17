const express = require('express');
const { registerUser, loginUser,getFuncionariosByHospital } = require('../controllers/userController');

const router = express.Router();

router.post('/register', registerUser);
router.get('/get/:id', getFuncionariosByHospital);
router.post('/login', loginUser);

module.exports = router;
