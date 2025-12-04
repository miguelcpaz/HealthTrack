const express = require('express');
const { registerHospital, listarHospitaisFormatado, loginHospital, getHospitalById } = require('../controllers/hospitalController');

const router = express.Router();

router.post('/register', registerHospital);
router.post('/login', loginHospital); 
router.get('/listar', listarHospitaisFormatado); 
router.get('/:id', getHospitalById) ;

module.exports = router;
