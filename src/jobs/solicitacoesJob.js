const cron = require("node-cron");
const nodemailer = require("nodemailer");
const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

const prisma = new PrismaClient();

// Mapeamento de tipo de usuário
const tiposUser = {
  1: "Técnico de Enfermagem",
  2: "Enfermeiro",
  3: "Médico",
};

// 🕒 Agendamento: hoje, 15/10 às 12:45
cron.schedule("0 0 9 * * 1", async () => {
  console.log("📨 Enviando e-mails de solicitações pendentes...");

  try {
    // Busca todas as solicitações pendentes de aprovação
    const solicitacoesPendentes = await prisma.solicitation.findMany({
      where: { status: "pendente" },
      include: { user: true, hospital: true },
    });

    if (solicitacoesPendentes.length === 0) {
      console.log("Nenhuma solicitação pendente no momento.");
      return;
    }

    // Agrupa solicitações por hospital
    const porHospital = solicitacoesPendentes.reduce((acc, solicitacao) => {
      const nomeHospital = solicitacao.hospital.nome;
      if (!acc[nomeHospital]) acc[nomeHospital] = [];
      acc[nomeHospital].push(solicitacao);
      return acc;
    }, {});

    // Configura transporte de e-mail
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Envia e-mail individual para cada hospital
    for (const [hospitalNome, solicitacoes] of Object.entries(porHospital)) {
      const hospitalEmail = solicitacoes[0].hospital.email;

      const listaSolicitacoes = solicitacoes
        .map(
          (s) =>
            `• ${s.user.nome} (${tiposUser[s.user.tipo_user]}) — ${s.user.email}`
        )
        .join("<br>");

      const mensagem = `
<p>Olá, ${hospitalNome} 👋</p>

<p>Essas são as solicitações de cadastro pendentes no HealthTrack:</p> <br>

<p>${listaSolicitacoes}</p> <br>

<p>
  Acesse as solicitações: 
  <a href="http://localhost:3000/solicitacao.html">
    http://localhost:3000/solicitacao.html
  </a>
</p>

<p>🕒 Este e-mail é enviado automaticamente toda segunda-feira às 9h.</p>

<p>Atenciosamente,<br>Equipe HealthTrack</p>
`;

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: hospitalEmail,
        subject: "Solicitações pendentes de cadastro - HealthTrack",
        html: mensagem, // <-- envia HTML com botão
      });
    }

    console.log("📬 Todos os e-mails foram enviados com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao enviar e-mails semanais:", error);
  }
});
