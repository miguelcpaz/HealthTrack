const express = require('express');
const router = express.Router();
const { loginGeral } = require('../controllers/authController');

router.post('/login', loginGeral);

module.exports = router;
