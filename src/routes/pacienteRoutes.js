const express = require('express');
const { registerPaciente, getPacientes, getPacientesByHospital, editPaciente} = require('../controllers/pacienteController');

const router = express.Router();

// Cadastro
router.post('/register', registerPaciente);
router.get('/get', getPacientes);
router.put('/:id', editPaciente);
router.get('/get/:id', getPacientesByHospital);

module.exports = router;
