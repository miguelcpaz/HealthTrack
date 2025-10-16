const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Listar solicitações pendentes do hospital logado
async function listarSolicitacoes(req, res) {
  try {
    const { hospitalId } = req.params;

    const solicitacoes = await prisma.solicitation.findMany({
      where: { hospitalId: Number(hospitalId), status: "pendente" },
      include: { user: true },
    });

    return res.json(solicitacoes);
  } catch (error) {
    console.error("Erro ao buscar solicitações:", error);
    return res.status(500).json({ error: "Erro ao buscar solicitações." });
  }
}

// Aceitar solicitação
async function aceitarSolicitacao(req, res) {
  const { id } = req.params; // corresponde à rota /:id/aprovar

  try {
    const solicitacao = await prisma.solicitation.findUnique({
      where: { id: Number(id) },
    });

    if (!solicitacao) {
      return res.status(404).json({ error: "Solicitação não encontrada" });
    }

    const [solAtualizada, usuarioAtualizado] = await prisma.$transaction([
      prisma.solicitation.update({
        where: { id: Number(id) },
        data: { status: "aceito" }
      }),
      prisma.user.update({
        where: { id: solicitacao.userId },
        data: { status_cadastro: "aprovado" }
      })
    ]);

    return res.status(200).json({ message: "Solicitação aceita e usuário aprovado!" });
  } catch (error) {
    console.error("Erro ao aceitar solicitação:", error);
    return res.status(500).json({ error: "Erro ao aceitar solicitação" });
  }
}

async function recusarSolicitacao(req, res) {
  const { id } = req.params; // corresponde à rota /:id/recusar

  try {
    const solicitacao = await prisma.solicitation.findUnique({
      where: { id: Number(id) },
    });

    if (!solicitacao) {
      return res.status(404).json({ error: "Solicitação não encontrada." });
    }

    // Exclui o usuário primeiro
    await prisma.user.delete({
      where: { id: solicitacao.userId },
    });

    // Depois exclui a solicitação
    await prisma.solicitation.delete({
      where: { id: Number(id) },
    });

    return res.json({ message: "Solicitação recusada e removida do sistema." });
  } catch (error) {
    console.error("Erro ao recusar solicitação:", error);
    return res.status(500).json({ error: "Erro ao recusar solicitação." });
  }
}


module.exports = { listarSolicitacoes, aceitarSolicitacao, recusarSolicitacao };
