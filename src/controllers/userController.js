// controllers/userController.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Resend } = require("resend");
const nodemailer = require("nodemailer");

const resend = new Resend(process.env.RESEND_API_KEY);

// Função auxiliar para enviar e-mails
async function enviarEmail(destinatario, assunto, texto) {
  try {
    if (process.env.NODE_ENV === "production") {
      // 🔹 Usa Resend em produção (Render, Railway, etc.)
      await resend.emails.send({
        from: "HealthTrack <no-reply@healthtrack.app>",
        to: destinatario,
        subject: assunto,
        text: texto,
      });
      console.log(`📧 E-mail enviado via Resend para ${destinatario}`);
    } else {
      // 🔹 Usa Nodemailer localmente (para testes)
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        tls: { rejectUnauthorized: false },
      });

      await transporter.sendMail({
        from: `"HealthTrack" <${process.env.EMAIL_USER}>`,
        to: destinatario,
        subject: assunto,
        text: texto,
      });

      console.log(`📧 E-mail enviado via Nodemailer para ${destinatario}`);
    }
  } catch (error) {
    console.error("❌ Erro ao enviar e-mail:", error);
  }
}

// ====================== CADASTRAR USUÁRIO ======================
exports.registerUser = async (req, res) => {
  try {
    const { nome, email, cpf, tipo_usuario } = req.body;

    if (!nome || !email || !cpf || !tipo_usuario) {
      return res.status(400).json({ error: "Preencha todos os campos obrigatórios." });
    }

    const [existingUser] = await db.query("SELECT * FROM usuarios WHERE email = ? OR cpf = ?", [email, cpf]);
    if (existingUser.length > 0) {
      return res.status(400).json({ error: "Usuário com este e-mail ou CPF já existe." });
    }

    const senhaTemporaria = Math.random().toString(36).slice(-8);
    const senhaHash = await bcrypt.hash(senhaTemporaria, 10);

    await db.query(
      "INSERT INTO usuarios (nome, email, cpf, senha, tipo_usuario) VALUES (?, ?, ?, ?, ?)",
      [nome, email, cpf, senhaHash, tipo_usuario]
    );

    const assunto = "📬 Bem-vindo ao HealthTrack - Acesso ao Sistema";
    const texto = `Olá ${nome},

Seja bem-vindo ao HealthTrack!

O seu usuário foi cadastrado com sucesso em nossa plataforma. Para acessar o sistema, utilize a senha temporária abaixo:

🔐 Senha temporária: ${senhaTemporaria}

⚠️ Altere-a após o primeiro login por segurança.

Atenciosamente,
Equipe HealthTrack
(Mensagem automática - não responda este e-mail)`;

    await enviarEmail(email, assunto, texto);

    res.status(201).json({ message: "Usuário cadastrado e e-mail enviado com sucesso!" });
  } catch (error) {
    console.error("Erro ao cadastrar usuário:", error);
    res.status(500).json({ error: "Erro interno ao cadastrar usuário." });
  }
};

// ====================== LOGIN DE USUÁRIO ======================
exports.loginUser = async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: "E-mail e senha são obrigatórios." });
    }

    const [rows] = await db.query("SELECT * FROM usuarios WHERE email = ?", [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: "Usuário não encontrado." });
    }

    const user = rows[0];
    const senhaCorreta = await bcrypt.compare(senha, user.senha);

    if (!senhaCorreta) {
      return res.status(401).json({ error: "Senha incorreta." });
    }

    const token = jwt.sign({ id: user.id, tipo_usuario: user.tipo_usuario }, process.env.JWT_SECRET, {
      expiresIn: "8h",
    });

    res.json({
      message: "Login realizado com sucesso!",
      token,
      usuario: { id: user.id, nome: user.nome, tipo_usuario: user.tipo_usuario },
    });
  } catch (error) {
    console.error("Erro ao realizar login:", error);
    res.status(500).json({ error: "Erro interno ao realizar login." });
  }
};

// ====================== CADASTRAR USUÁRIOS VIA EXCEL ======================
exports.registerUsersFromExcel = async (req, res) => {
  try {
    const usuarios = req.body; // Array de objetos [{nome, email, cpf, tipo_usuario}, ...]

    if (!Array.isArray(usuarios) || usuarios.length === 0) {
      return res.status(400).json({ error: "Nenhum usuário recebido para cadastro." });
    }

    const resultados = [];

    for (const usuario of usuarios) {
      const { nome, email, cpf, tipo_usuario } = usuario;

      if (!nome || !email || !cpf || !tipo_usuario) {
        resultados.push({ email, status: "❌ Campos obrigatórios faltando." });
        continue;
      }

      const [existingUser] = await db.query("SELECT * FROM usuarios WHERE email = ? OR cpf = ?", [email, cpf]);
      if (existingUser.length > 0) {
        resultados.push({ email, status: "⚠️ Usuário já existe." });
        continue;
      }

      const senhaTemporaria = Math.random().toString(36).slice(-8);
      const senhaHash = await bcrypt.hash(senhaTemporaria, 10);

      await db.query(
        "INSERT INTO usuarios (nome, email, cpf, senha, tipo_usuario) VALUES (?, ?, ?, ?, ?)",
        [nome, email, cpf, senhaHash, tipo_usuario]
      );

      const assunto = "📬 Cadastro no HealthTrack - Acesso ao Sistema";
      const texto = `Olá ${nome},

Você foi cadastrado no HealthTrack!

Acesse a plataforma com as credenciais abaixo:
E-mail: ${email}
Senha temporária: ${senhaTemporaria}

⚠️ Altere sua senha após o primeiro login.

Atenciosamente,
Equipe HealthTrack`;

      await enviarEmail(email, assunto, texto);

      resultados.push({ email, status: "✅ Usuário cadastrado e e-mail enviado." });
    }

    res.status(201).json({
      message: "Processo de cadastro concluído.",
      resultados,
    });
  } catch (error) {
    console.error("Erro ao cadastrar usuários via Excel:", error);
    res.status(500).json({ error: "Erro interno ao cadastrar usuários via Excel." });
  }
};
