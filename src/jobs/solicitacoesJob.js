// jobs/solicitacoesJob.js
const cron = require("node-cron");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const tiposUser = {
  1: "Técnico de Enfermagem",
  2: "Enfermeiro",
  3: "Médico",
};

async function enviarEmailBrevo(destinatario, nomeDestinatario, assunto, htmlContent, textoAlternativo) {
  if (!destinatario) {
    console.warn(`E-mail do destinatário não fornecido para ${nomeDestinatario}. Pulando envio.`);
    return;
  }

  try {
    console.log(`📨 Enviando e-mail para ${destinatario}...`);

    const resposta = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": process.env.BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "HealthTrack", email: process.env.SENDER_EMAIL },
        to: [{ email: destinatario, name: nomeDestinatario }],
        subject: assunto,
        htmlContent,
        textContent: textoAlternativo,
      }),
    });

    const data = await resposta.json();
    console.log(`Status: ${resposta.status}`, data);

    if (!resposta.ok) throw new Error(JSON.stringify(data));

    console.log(`✅ E-mail enviado para ${destinatario}`);
  } catch (err) {
    console.error(`❌ Erro ao enviar e-mail para ${destinatario}:`, err);
  }
}

// Cron: todos os dias às 23:52
setImmediate(() => {
  cron.schedule("44 00 * * *", async () => {
    console.log("⏰ Cron disparou: enviando e-mails de solicitações pendentes...");

    try {
      const solicitacoesPendentes = await prisma.solicitation.findMany({
        where: { status: "pendente" },
        include: { user: true, hospital: true },
      });

      if (!solicitacoesPendentes.length) {
        console.log("Nenhuma solicitação pendente.");
        return;
      }

      const porHospital = solicitacoesPendentes.reduce((acc, s) => {
        const nome = s.hospital.nome;
        if (!acc[nome]) acc[nome] = [];
        acc[nome].push(s);
        return acc;
      }, {});

      for (const [hospitalNome, solicitacoes] of Object.entries(porHospital)) {
        const hospitalEmail = solicitacoes[0].hospital.email;
        if (!hospitalEmail) {
          console.warn(`Hospital ${hospitalNome} não tem e-mail. Pulando.`);
          continue;
        }

        const listaHtml = solicitacoes.map(s => `• ${s.user.nome} (${tiposUser[s.user.tipo_user]}) — ${s.user.email}`).join("<br>");
        const listaTexto = solicitacoes.map(s => `• ${s.user.nome} (${tiposUser[s.user.tipo_user]}) — ${s.user.email}`).join("\n");

        const html = `<p>Olá, ${hospitalNome}</p><p>${listaHtml}</p>`;
        const texto = `Olá, ${hospitalNome}\n${listaTexto}`;

        await enviarEmailBrevo(hospitalEmail, hospitalNome, "Solicitações pendentes - HealthTrack", html, texto);
      }

      console.log("📬 Todos os e-mails processados!");
    } catch (err) {
      console.error("❌ Erro no cron de solicitações:", err);
    }
  });
});
