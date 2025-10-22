const cron = require("node-cron");
const { PrismaClient } = require("@prisma/client");
require("dotenv").config();
const prisma = new PrismaClient();

// Mapeamento de tipo de usuário
const tiposUser = {
  1: "Técnico de Enfermagem",
  2: "Enfermeiro",
  3: "Médico",
};

// Função de envio de e-mail via Brevo
async function enviarEmailBrevo(destinatario, nomeDestinatario, assunto, htmlContent, textoAlternativo) {
  try {
    if (!destinatario) {
      console.warn(`E-mail do destinatário não fornecido para ${nomeDestinatario}. Pulando envio.`);
      return;
    }

    console.log(`📨 Tentando enviar e-mail para ${destinatario}...`);

    const resposta = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": process.env.BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: "HealthTrack",
          email: process.env.SENDER_EMAIL || "healthtrack.tcc@gmail.com"
        },
        to: [{ email: destinatario, name: nomeDestinatario }],
        subject: assunto,
        htmlContent: htmlContent,
        textContent: textoAlternativo,
      }),
    });

    const data = await resposta.json();

    console.log(`Status da resposta Brevo: ${resposta.status}`);
    console.log("Retorno do Brevo:", data);

    if (!resposta.ok) {
      throw new Error(`Erro na API Brevo: ${JSON.stringify(data)}`);
    }

    console.log(`✅ E-mail enviado com sucesso para ${destinatario}`);
    return data;

  } catch (err) {
    console.error(`❌ Erro ao enviar e-mail para ${destinatario}:`, err);
  }
}

// 🕒 Agendamento: todos os dias às 23:52
cron.schedule("18 00 * * *", async () => {
  console.log("⏰ Iniciando envio diário de e-mails de solicitações pendentes...");

  try {
    // Busca todas as solicitações pendentes de aprovação
    const solicitacoesPendentes = await prisma.solicitation.findMany({
      where: { status: "pendente" },
      include: { user: true, hospital: true },
    });

    console.log(`📊 Solicitações pendentes encontradas: ${solicitacoesPendentes.length}`);

    if (solicitacoesPendentes.length === 0) {
      console.log("Nenhuma solicitação pendente no momento. Encerrando cron.");
      return;
    }

    // Agrupa solicitações por hospital
    const porHospital = solicitacoesPendentes.reduce((acc, solicitacao) => {
      const nomeHospital = solicitacao.hospital.nome;
      if (!acc[nomeHospital]) acc[nomeHospital] = [];
      acc[nomeHospital].push(solicitacao);
      return acc;
    }, {});

    // Envia e-mail individual para cada hospital
    for (const [hospitalNome, solicitacoes] of Object.entries(porHospital)) {
      const hospitalEmail = solicitacoes[0].hospital.email;

      console.log(`🏥 Hospital: ${hospitalNome}, Email: ${hospitalEmail}, Nº de solicitações: ${solicitacoes.length}`);

      if (!hospitalEmail) {
        console.warn(`Hospital ${hospitalNome} não possui e-mail válido. Pulando envio.`);
        continue;
      }

      const listaSolicitacoesHtml = solicitacoes
        .map(s => `• ${s.user.nome} (${tiposUser[s.user.tipo_user]}) — ${s.user.email}`)
        .join("<br>");

      const mensagemHtml = `
<p>Olá, ${hospitalNome} 👋</p>
<p>Essas são as solicitações de cadastro pendentes no HealthTrack:</p><br>
<p>${listaSolicitacoesHtml}</p><br>
<p>
  Acesse as solicitações: 
  <a href="http://healthtrack-p6oq.onrender.com/solicitacao.html">
    http://healthtrack-p6oq.onrender.com/solicitacao.html
  </a>
</p>
<p>🕒 Este e-mail é enviado automaticamente todos os dias às 23:52.</p>
<p>Atenciosamente,<br>Equipe HealthTrack</p>
`;

      const listaSolicitacoesTexto = solicitacoes
        .map(s => `• ${s.user.nome} (${tiposUser[s.user.tipo_user]}) — ${s.user.email}`)
        .join("\n");

      const mensagemTexto = `
Olá, ${hospitalNome}

Essas são as solicitações de cadastro pendentes no HealthTrack:

${listaSolicitacoesTexto}

Acesse as solicitações: http://healthtrack-p6oq.onrender.com/solicitacao.html

Este e-mail é enviado automaticamente todos os dias às 23:52.

Atenciosamente,
Equipe HealthTrack
`;

      // Envio de e-mail
      await enviarEmailBrevo(hospitalEmail, hospitalNome, "Solicitações pendentes de cadastro - HealthTrack", mensagemHtml, mensagemTexto);
    }

    console.log("📬 Todos os e-mails processados!");

  } catch (error) {
    console.error("❌ Erro ao processar envio diário de e-mails:", error);
  }
});
