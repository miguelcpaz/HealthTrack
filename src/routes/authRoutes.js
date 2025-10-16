const express = require('express');
const router = express.Router();
const { loginGeral, trocar_senhatemp } = require('../controllers/authController');

router.post('/login', loginGeral);
router.patch('/change-temp-password/:email', trocar_senhatemp);

module.exports = router;
