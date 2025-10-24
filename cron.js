require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const tiposUser = {
  1: "Técnico de Enfermagem",
  2: "Enfermeiro",
  3: "Médico",
};

// Funções (copie as suas existentes)
async function enviarEmailBrevo(destinatario, nomeDestinatario, assunto, htmlContent, textoAlternativo) {
  if (!destinatario) return;
  try {
    const resposta = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": process.env.BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: process.env.SENDER_NAME, email: process.env.SENDER_EMAIL },
        to: [{ email: destinatario, name: nomeDestinatario }],
        subject: assunto,
        htmlContent,
        textContent: textoAlternativo,
      }),
    });
    const data = await resposta.json();
    console.log("Status:", resposta.status, data);
  } catch (err) {
    console.error("Erro ao enviar e-mail:", err);
  }
}

async function dispararSolicitacoes() {
  const solicitacoesPendentes = await prisma.solicitation.findMany({
    where: { status: "pendente" },
    include: { user: true, hospital: true },
  });

  if (!solicitacoesPendentes.length) return console.log("Nenhuma solicitação pendente.");

  const porHospital = solicitacoesPendentes.reduce((acc, s) => {
    const nome = s.hospital.nome;
    if (!acc[nome]) acc[nome] = [];
    acc[nome].push(s);
    return acc;
  }, {});

  for (const [hospitalNome, solicitacoes] of Object.entries(porHospital)) {
    const hospitalEmail = solicitacoes[0].hospital.email;
    if (!hospitalEmail) continue;

    const listaHtml = solicitacoes
      .map(s => `• <strong>${s.user.nome}</strong> (${tiposUser[s.user.tipo_user]}) — ${s.user.email}`)
      .join("<br>");
    const listaTexto = solicitacoes
      .map(s => `• ${s.user.nome} (${tiposUser[s.user.tipo_user]}) — ${s.user.email}`)
      .join("\n");

    const html = `<p>Olá, <strong>${hospitalNome}</strong>,</p>
<p>Você possui novas <strong>solicitações de cadastro pendentes</strong> no sistema <strong>HealthTrack</strong>:</p>
<p>${listaHtml}</p>
<p>Acesse o painel administrativo para analisar ou aprovar/rejeitar as solicitações.</p>
<p>Atenciosamente,<br><strong>Equipe HealthTrack</strong></p>`;

    const texto = `Olá, ${hospitalNome},

Você possui novas solicitações de cadastro pendentes no sistema HealthTrack:

${listaTexto}

Acesse o painel administrativo para analisar ou aprovar/rejeitar as solicitações.

Atenciosamente,
Equipe HealthTrack`;

    await enviarEmailBrevo(hospitalEmail, hospitalNome, "Novas solicitações pendentes - HealthTrack", html, texto);
  }

  console.log("E-mails de solicitações enviados!");
}

async function atualizarPacientes() {
  const result = await prisma.paciente.updateMany({
    where: { estadia: { gt: 0 } },
    data: { estadia: { decrement: 1 } },
  });
  console.log(`Estadias atualizadas! Pacientes afetados: ${result.count}`);
}

// ✅ Executar de acordo com argumento
async function main() {
  const tarefa = process.argv[2]; // recebe "emails" ou "pacientes"

  if (tarefa === "emails") {
    await dispararSolicitacoes();
  } else if (tarefa === "pacientes") {
    await atualizarPacientes();
  } else {
    console.log("Use: node cron.js [emails|pacientes]");
  }

  await prisma.$disconnect();
}

main();
