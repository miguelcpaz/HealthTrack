const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Cadastro de usuário
async function registerUser(req, res) {
  const { nome, cpf, email, senha, crm, tipo_user } = req.body;

  try {
    // Verifica se o email já existe
    const emailCheck = await prisma.user.findUnique({
      where: { email }
    });
    if (emailCheck) {
      return res.status(400).json({ error: 'Email já cadastrado.' });
    }

    // Verifica se o CPF já existe
    const cpfCheck = await prisma.user.findUnique({
      where: { cpf }
    });
    if (cpfCheck) {
      return res.status(400).json({ error: 'CPF já cadastrado.' });
    }

    // Se tudo certo, cria usuário
    const newUser = await prisma.user.create({
      data: { nome, cpf, email, senha, crm, tipo_user }
    });

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

module.exports = {
  registerUser,
  loginUser
};
