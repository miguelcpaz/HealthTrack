const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const crypto = require("crypto");
const bcrypt = require("bcrypt");
require("dotenv").config();


// ======================================================
// Função envio de e-mail via Brevo
// ======================================================
async function enviarEmailBrevo(destinatario, assunto, htmlContent, textoAlternativo) {
  try {
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
        to: [{ email: destinatario }],
        subject: assunto,
        htmlContent,
        textContent: textoAlternativo,
      }),
    });

    const data = await resposta.json();
    if (!resposta.ok) throw new Error(JSON.stringify(data));

    console.log("E-mail enviado via Brevo:", data);
    return data;

  } catch (err) {
    console.error("Erro ao enviar e-mail via Brevo:", err);
    throw err;
  }
}


// ======================================================
// Cadastro de hospital
// ======================================================
async function registerHospital(req, res) {
  try {
    const {
      nome, cnpj, cnes, cep, numero,
      telefone, email, website,
      tipoEstabelecimento
    } = req.body;

    const hospitalExists = await prisma.hospital.findFirst({
      where: { OR: [{ email }, { cnpj }, { cnes }] },
    });

    const emailExists = await prisma.user.findUnique({ where: { email } });

    if (hospitalExists || emailExists) {
      return res.status(400).json({
        error: "Hospital já cadastrado com esses dados."
      });
    }

    const senhaTemporaria =
      crypto.randomBytes(3).toString("hex") +
      Math.floor(Math.random() * 1000);

    const senhaHash = await bcrypt.hash(senhaTemporaria, 10);

    await prisma.hospital.create({
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
        status_senha: 1
      },
    });

    await enviarEmailBrevo(
      email,
      "📬 Bem-vindo ao HealthTrack - Acesso ao Sistema",
      `<p>Olá,</p>
       <p>Seu hospital foi cadastrado no <strong>HealthTrack</strong>.</p>
       <p>🔐 <strong>Senha temporária:</strong> ${senhaTemporaria}</p>
       <p>⚠️ Altere sua senha no primeiro login.</p>
       <p>Equipe HealthTrack</p>`,
      `Olá,
Seu hospital foi cadastrado no HealthTrack.
Senha temporária: ${senhaTemporaria}
Altere sua senha no primeiro login.`
    );

    res.status(201).json({
      message: "Hospital cadastrado com sucesso."
    });

  } catch (error) {
    console.error("Erro ao cadastrar hospital:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
}


// ======================================================
// Login hospital
// ======================================================
async function loginHospital(req, res) {
  try {
    const { email, senha } = req.body;

    const hospital = await prisma.hospital.findUnique({
      where: { email }
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
      tipo: "hospital",
      dados: {
        id: hospital.id,
        nome: hospital.nome,
        email: hospital.email,
        tipo_user: 4
      }
    });

  } catch (error) {
    console.error("Erro no login do hospital:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
}


// ======================================================
// Listar hospitais (PROTEGIDO - usuário logado)
// ======================================================
async function listarHospitaisFormatado(req, res) {
  try {

    if (!req.user) {
      return res.status(401).json({ error: "Não autorizado." });
    }

    const hospitais = await prisma.hospital.findMany();

    const hospitaisComCidade = await Promise.all(
      hospitais.map(async (hospital) => {
        try {
          const response = await fetch(
            `https://viacep.com.br/ws/${hospital.cep}/json/`
          );
          const data = await response.json();
          const cidade = data.localidade || "Cidade Desconhecida";

          return {
            id: hospital.id,
            nomeFormatado: `${hospital.nome} - ${cidade} ${hospital.numero}`
          };

        } catch {
          return {
            id: hospital.id,
            nomeFormatado: `${hospital.nome} - Cidade Desconhecida`
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


// ======================================================
// Buscar hospital por ID (PROTEGIDO)
// ======================================================
async function getHospitalById(req, res) {
  try {

    if (!req.user) {
      return res.status(401).json({ error: "Não autorizado." });
    }

    const { id } = req.params;

    const hospital = await prisma.hospital.findUnique({
      where: { id: parseInt(id) },
    });

    if (!hospital) {
      return res.status(404).json({
        error: "Hospital não encontrado."
      });
    }

    res.status(200).json(hospital);

  } catch (error) {
    console.error("Erro ao buscar hospital:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
}


module.exports = {
  registerHospital,
  loginHospital,
  listarHospitaisFormatado,
  getHospitalById
};