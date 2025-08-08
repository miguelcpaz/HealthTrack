const express = require('express');
const { registerPaciente, getPacientes, getPacienteById, editPaciente} = require('../controllers/pacienteController');

const router = express.Router();

// Cadastro
router.post('/register', registerPaciente);
router.get('/get', getPacientes);
router.put('/:id', editPaciente);

module.exports = router;
