// routes/cronRoutes.js
const express = require("express");
const router = express.Router();
const { dispararSolicitacoes, atualizarPacientes } = require("../controllers/cronController");

// Endpoint que dispara e-mails de solicitações
router.get("/solicitacoes", dispararSolicitacoes);

// Endpoint que atualiza estadias de pacientes
router.get("/pacientes", atualizarPacientes);

module.exports = router;
