// routes/solicitationRoutes.js
const express = require("express");
const router = express.Router();
const {
  listarSolicitacoes,
  aceitarSolicitacao,
  recusarSolicitacao,
} = require("../controllers/solicitacaoController");

router.get("/:hospitalId", listarSolicitacoes);
router.put("/:id/aprovar", aceitarSolicitacao);
router.put("/:id/recusar", recusarSolicitacao);

module.exports = router;
