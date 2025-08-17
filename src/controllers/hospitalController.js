const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

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
    } = req.body;

    // Verifica se hospital já existe pelo email, cnpj ou cnes
    const hospitalExists = await prisma.hospital.findFirst({
      where: {
        OR: [{ email }, { cnpj }, { cnes }],
      },
    });

    if (hospitalExists) {
      return res.status(400).json({ error: "Hospital já cadastrado com esses dados." });
    }

    // Gera senha temporária aleatória
    const senhaTemporaria = crypto.randomBytes(6).toString("hex"); // 12 caracteres hex

    // Hash da senha temporária
    const senhaHash = await bcrypt.hash(senhaTemporaria, 10);

    // Cria o hospital no banco com a senha hashada
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
      },
    });

    // Configura o transporter do Nodemailer dentro do controller
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,   // exemplo: "smtp.gmail.com"
      port: process.env.EMAIL_PORT,   // exemplo: 587
      secure: process.env.EMAIL_SECURE === "true", // true para 465, false para 587
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Enviar email com a senha temporária
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "📬 Bem-vindo ao HealthTrack - Acesso ao Sistema",
      text: `Olá,

Seja bem-vindo ao HealthTrack!

O seu hospital foi cadastrado com sucesso em nossa plataforma. Para acessar o sistema, utilize as credenciais temporárias abaixo:

🔐 Senha temporária de acesso: ${senhaTemporaria}

⚠️ Por razões de segurança, é extremamente importante que você altere essa senha assim que realizar o primeiro login.

Através da plataforma, você poderá:
- Gerenciar pacientes de forma rápida e segura;
- Acompanhar internações, prescrições e relatórios clínicos;
- Organizar sua equipe e muito mais.

Caso você não tenha solicitado este cadastro, ou tenha recebido este e-mail por engano, por favor, entre em contato com a nossa equipe imediatamente.

Se precisar de ajuda, conte com nosso suporte:

📧 healthtrack.tcc@gmail.com  

Obrigado por confiar na nossa solução.

Atenciosamente,  
Equipe HealthTrack

MENSAGEM AUTOMATICA NÃO RESPONDA!
`,
    };


    await transporter.sendMail(mailOptions);

    res
      .status(201)
      .json({ message: "Hospital cadastrado com sucesso, senha temporária enviada por email." });
  } catch (error) {
    console.error("Erro ao cadastrar hospital:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
}

async function loginHospital(req, res) {
  try {
    const { email, senha } = req.body;

    // Verifica se o hospital existe pelo e-mail
    const hospital = await prisma.hospital.findUnique({
      where: { email },
    });

    if (!hospital) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    // Verifica se a senha está correta
    const senhaValida = await bcrypt.compare(senha, hospital.senha);

    if (!senhaValida) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    // Aqui você pode gerar um token JWT se desejar
    // const token = jwt.sign({ id: hospital.id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.status(200).json({
      message: "Login realizado com sucesso.",
      hospital: {
        id: hospital.id,
        nome: hospital.nome,
        email: hospital.email,
      },
      // token, // caso implemente JWT
    });
  } catch (error) {
    console.error("Erro no login do hospital:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
}


async function listarHospitaisFormatado(req, res) {
  try {
    const hospitais = await prisma.hospital.findMany();

    const hospitaisFiltrados = hospitais.filter(h => h.id !== 0); // <-- filtra o id 0

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
