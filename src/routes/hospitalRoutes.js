const express = require('express');
const { registerHospital, listarHospitaisFormatado, loginHospital} = require('../controllers/hospitalController');

const router = express.Router();

router.post('/register', registerHospital);
router.post('/login', loginHospital); 
router.get('/listar', listarHospitaisFormatado);  

module.exports = router;
