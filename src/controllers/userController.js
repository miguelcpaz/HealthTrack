const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

async function registerUser(req, res) {
  const { nome, cpf, email, crm, uf, tipo_user, hospitalId, status_senha } = req.body;

  console.log()

  try {
    const senhaTemporaria = crypto.randomBytes(6).toString("hex");

    // 🔹 Valida CRM apenas para médicos (tipo_user === 3)
    const emailCheck = await prisma.user.findUnique({ where: { email } });
    if (emailCheck) {
      return res.status(400).json({ error: 'Email já cadastrado.' });
    }

    // Verifica se CPF já existe
    const cpfCheck = await prisma.user.findUnique({ where: { cpf } });
    if (cpfCheck) {
      return res.status(400).json({ error: 'CPF já cadastrado.' });
    }

    // Gera hash da senha
    const senhaHash = await bcrypt.hash(senhaTemporaria, 10);

    // Cria usuário
    const newUser = await prisma.user.create({
      data: {
        nome,
        cpf,
        email,
        senha: senhaHash,
        crm: `${crm}/${uf}`, // interpolação correta
        tipo_user,
        hospitalId,
        status_senha
      }
    });

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
    
    O seu Usuario foi cadastrado com sucesso em nossa plataforma. Para acessar o sistema, utilize as credenciais temporárias abaixo:
    
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

    return res.status(201).json({ message: 'Usuário cadastrado com sucesso!', usuario: newUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao cadastrar usuário.' });
  }
}

// Login de usuário
async function loginUser(req, res) {
  const { email, senha } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({ error: 'Usuário não encontrado.' });
    }

    if (user.senha !== senha) {
      return res.status(401).json({ error: 'Senha incorreta.' });
    }

    return res.status(200).json({
      message: 'Login realizado com sucesso!',
      usuario: user
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao tentar fazer login.' });
  }
}

async function getFuncionariosByHospital(req, res) {
  const { id } = req.params; // hospitalId

  try {
    const funcionarios = await prisma.user.findMany({
      where: { hospitalId: Number(id) }
    });

    if (!funcionarios || funcionarios.length === 0) {
      return res.status(404).json({ error: 'Nenhum funcionario encontrado para este hospital.' });
    }
    return res.status(200).json(funcionarios);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar funcionarios.' });
  }
}

module.exports = {
  registerUser,
  loginUser,
  getFuncionariosByHospital
};
