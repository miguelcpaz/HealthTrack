// controllers/cronController.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const tiposUser = {
  1: "Técnico de Enfermagem",
  2: "Enfermeiro",
  3: "Médico",
};

// Função de envio de e-mail via Brevo
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
        sender: { name: "HealthTrack", email: process.env.SENDER_EMAIL },
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

// Dispara e-mails de solicitações
async function dispararSolicitacoes(req, res) {
  try {
    const solicitacoesPendentes = await prisma.solicitation.findMany({
      where: { status: "pendente" },
      include: { user: true, hospital: true },
    });

    if (!solicitacoesPendentes.length) {
      return res.json({ message: "Nenhuma solicitação pendente." });
    }

    const porHospital = solicitacoesPendentes.reduce((acc, s) => {
      const nome = s.hospital.nome;
      if (!acc[nome]) acc[nome] = [];
      acc[nome].push(s);
      return acc;
    }, {});

    for (const [hospitalNome, solicitacoes] of Object.entries(porHospital)) {
      const hospitalEmail = solicitacoes[0].hospital.email;
      if (!hospitalEmail) continue;

      const listaHtml = solicitacoes.map(s => `• ${s.user.nome} (${tiposUser[s.user.tipo_user]}) — ${s.user.email}`).join("<br>");
      const listaTexto = solicitacoes.map(s => `• ${s.user.nome} (${tiposUser[s.user.tipo_user]}) — ${s.user.email}`).join("\n");

      const html = `<p>Olá, ${hospitalNome}</p><p>${listaHtml}</p>`;
      const texto = `Olá, ${hospitalNome}\n${listaTexto}`;

      await enviarEmailBrevo(hospitalEmail, hospitalNome, "Solicitações pendentes - HealthTrack", html, texto);
    }

    res.json({ message: "E-mails de solicitações enviados com sucesso!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao enviar e-mails de solicitações" });
  }
}

// Atualiza estadias de pacientes
async function atualizarPacientes(req, res) {
  try {
    const result = await prisma.paciente.updateMany({
      where: { estadia: { gt: 0 } },
      data: { estadia: { decrement: 1 } },
    });

    res.json({ message: `Estadias atualizadas! Pacientes afetados: ${result.count}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao atualizar estadias" });
  }
}

module.exports = { dispararSolicitacoes, atualizarPacientes };
