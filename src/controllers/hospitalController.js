const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const SibApiV3Sdk = require("@sendinblue/client");
require("dotenv").config();

// Configura Brevo
const client = new SibApiV3Sdk.TransactionalEmailsApi();
client.setApiKey(
  SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

async function registerHospital(req, res) {
  try {
    const {
      nome,
      cnpj,
      cnes,
      cep,
      numero,
      telefone,
      email,
      website,
      tipoEstabelecimento,
      status_senha
    } = req.body;

    const hospitalExists = await prisma.hospital.findFirst({
      where: {
        OR: [{ email }, { cnpj }, { cnes }],
      },
    });

    const emailExists = await prisma.user.findUnique({
      where: { email },
    });

    if (hospitalExists || emailExists) {
      return res.status(400).json({ error: "Hospital já cadastrado com esses dados." });
    }

    const senhaTemporaria = crypto.randomBytes(6).toString("hex");
    const senhaHash = await bcrypt.hash(senhaTemporaria, 10);

    const hospital = await prisma.hospital.create({
      data: {
        nome,
        cnpj,
        cnes,
        cep,
        numero,
        telefone,
        email,
        senha: senhaHash,
        website,
        tipoEstabelecimento,
        status_senha
      },
    });

    const mensagem = `
<p>Olá,</p>

<p>Seja bem-vindo ao HealthTrack!</p>

<p>O seu hospital foi cadastrado com sucesso em nossa plataforma. Para acessar o sistema, utilize as credenciais temporárias abaixo:</p>

<p>🔐 Senha temporária de acesso: <strong>${senhaTemporaria}</strong></p>

<p>⚠️ Por razões de segurança, é extremamente importante que você altere essa senha assim que realizar o primeiro login.</p>

<p>Através da plataforma, você poderá:</p>
<ul>
<li>Gerenciar pacientes de forma rápida e segura;</li>
<li>Acompanhar internações, prescrições e relatórios clínicos;</li>
<li>Organizar sua equipe e muito mais.</li>
</ul>

<p>Caso você não tenha solicitado este cadastro, ou tenha recebido este e-mail por engano, por favor, entre em contato com a nossa equipe imediatamente.</p>

<p>Se precisar de ajuda, conte com nosso suporte:</p>
<p>📧 healthtrack.tcc@gmail.com</p>

<p>Atenciosamente,<br>Equipe HealthTrack</p>
<p><small>MENSAGEM AUTOMÁTICA - NÃO RESPONDA!</small></p>
`;

    // Envia e-mail pelo Brevo
    await client.sendTransacEmail({
      sender: { name: "HealthTrack", email: process.env.BREVO_SENDER_EMAIL },
      to: [{ email, name: nome }],
      subject: "📬 Bem-vindo ao HealthTrack - Acesso ao Sistema",
      htmlContent: mensagem,
    });

    res.status(201).json({
      message: "Hospital cadastrado com sucesso, senha temporária enviada por email.",
    });
  } catch (error) {
    console.error("Erro ao cadastrar hospital:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
}

async function loginHospital(req, res) {
  try {
    const { email, senha } = req.body;

    const hospital = await prisma.hospital.findUnique({
      where: { email },
    });

    if (!hospital) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    const senhaValida = await bcrypt.compare(senha, hospital.senha);

    if (!senhaValida) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    res.status(200).json({
      message: "Login realizado com sucesso.",
      hospital: {
        id: hospital.id,
        nome: hospital.nome,
        email: hospital.email,
      },
    });
  } catch (error) {
    console.error("Erro no login do hospital:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
}

async function listarHospitaisFormatado(req, res) {
  try {
    const hospitais = await prisma.hospital.findMany();
    const hospitaisFiltrados = hospitais.filter(h => h.id !== 0);

    const hospitaisComCidade = await Promise.all(
      hospitaisFiltrados.map(async (hospital) => {
        try {
          const response = await fetch(`https://viacep.com.br/ws/${hospital.cep}/json/`);
          const data = await response.json();
          const cidade = data.localidade || "Cidade Desconhecida";

          return {
            id: hospital.id,
            nomeFormatado: `${hospital.nome} - ${cidade} ${hospital.numero}`
          };
        } catch (err) {
          console.error(`Erro ao buscar cidade do CEP ${hospital.cep}:`, err);
          return {
            id: hospital.id,
            nomeFormatado: `${hospital.nome} - (Cidade Desconhecida) ${hospital.numero}`
          };
        }
      })
    );

    res.json(hospitaisComCidade);
  } catch (error) {
    console.error("Erro ao listar hospitais:", error);
    res.status(500).json({ error: "Erro ao buscar hospitais." });
  }
}

module.exports = {
  registerHospital,
  listarHospitaisFormatado,
  loginHospital,
};
