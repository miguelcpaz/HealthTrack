const express = require('express');
const { registerPaciente, getPacientes, getPacientesByHospital, editPaciente, getQuartosByHospital, getPacientesCriticosByHospital, altaPaciente} = require('../controllers/pacienteController');

const router = express.Router();

router.post('/register', registerPaciente);
router.get('/get', getPacientes);
router.put('/:id', editPaciente);
router.put('/:id/alta', altaPaciente);
router.get('/get/:id', getPacientesByHospital);
router.get('/get/:hospitalId/quartos', getQuartosByHospital);
router.get('/get/:hospitalId/critico', getPacientesCriticosByHospital);


module.exports = router;
