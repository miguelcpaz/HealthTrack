const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");

// Cadastro de usuário
async function registerUser(req, res) {
  const { nome, cpf, email, senha, crm, tipo_user, hospitalId } = req.body;
  const senhaHash = await bcrypt.hash(senha, 10);

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
      data: { nome, cpf, email, senha: senhaHash, crm, tipo_user, hospitalId}
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
